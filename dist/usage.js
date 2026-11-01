/* Foreground learning time. No time before tracking began is inferred. */
(function (global) {
  'use strict';
  const STORAGE_KEY = 'wort-usage-v1';
  const LEASE_KEY = 'wort-usage-lease-v1';
  const IDLE_MS = 5 * 60 * 1000;
  const LEASE_MS = 12000;
  const HEARTBEAT_MS = 5000;
  const SAVE_MS = 15000;

  function dayKey(value) {
    const date = value instanceof Date ? value : new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function validDay(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    return dayKey(new Date(year, month - 1, day, 12)) === value;
  }
  function dayLength(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day + 1).getTime() - new Date(year, month - 1, day).getTime();
  }
  function finiteMs(value) { return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0; }
  function normalize(raw, now) {
    const result = { version: 1, startedAt: dayKey(now), days: {}, lastSavedAt: null };
    if (!raw || raw.version !== 1) return result;
    if (validDay(raw.startedAt)) result.startedAt = raw.startedAt;
    const source = Array.isArray(raw.days) ? raw.days : Object.entries(raw.days || {}).map(([day, value]) => ({ day, ...(typeof value === 'number' ? { activeMs: value } : value) }));
    for (const entry of source) {
      if (!entry || !validDay(entry.day)) continue;
      const contributions = {};
      if (entry.contributions && typeof entry.contributions === 'object') {
        for (const [id, ms] of Object.entries(entry.contributions)) if (finiteMs(ms)) contributions[id] = Math.min(ms, dayLength(entry.day));
      } else if (finiteMs(entry.activeMs)) contributions.legacy = Math.min(entry.activeMs, dayLength(entry.day));
      if (Object.keys(contributions).length) result.days[entry.day] = { contributions };
    }
    const earliest = Object.keys(result.days).sort()[0];
    if (earliest && earliest < result.startedAt) result.startedAt = earliest;
    if (typeof raw.lastSavedAt === 'string' && Number.isFinite(Date.parse(raw.lastSavedAt))) result.lastSavedAt = raw.lastSavedAt;
    return result;
  }
  function mergeStates(left, right) {
    const merged = { version: 1, startedAt: left.startedAt < right.startedAt ? left.startedAt : right.startedAt, days: {}, lastSavedAt: right.lastSavedAt || left.lastSavedAt };
    for (const source of [left, right]) for (const [day, value] of Object.entries(source.days)) {
      const row = merged.days[day] ||= { contributions: {} };
      for (const [id, ms] of Object.entries(value.contributions)) row.contributions[id] = Math.max(row.contributions[id] || 0, ms);
    }
    return merged;
  }
  function splitDuration(start, duration) {
    const parts = [];
    let cursor = start, remaining = duration;
    while (remaining > 0) {
      const date = new Date(cursor);
      const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
      const amount = Math.min(remaining, Math.max(1, midnight - cursor));
      parts.push({ day: dayKey(date), activeMs: amount });
      cursor += amount; remaining -= amount;
    }
    return parts;
  }

  function createTracker(options = {}) {
    const win = options.window || global;
    const doc = options.document || win.document;
    let storage;
    try { storage = options.storage || win.localStorage; } catch { storage = null; }
    const wallNow = options.wallNow || (() => Date.now());
    const monoNow = options.monoNow || (() => win.performance?.now?.() ?? Date.now());
    const setTick = options.setInterval || win.setInterval?.bind(win);
    const clearTick = options.clearInterval || win.clearInterval?.bind(win);
    const tabId = options.tabId || (win.crypto?.randomUUID?.() || `tab-${Math.random().toString(36).slice(2)}-${wallNow()}`);
    let persistent = Boolean(storage), started = false, focused = true, leader = false, timer = null;
    let lastPerf = 0, lastWall = 0, lastActivityPerf = 0, lastSavePerf = 0, lastNotifyPerf = -Infinity;
    let currentSessionMs = 0;
    const callbacks = new Set();
    const listeners = [];
    function parse(value) { try { return JSON.parse(value); } catch { return null; } }
    function stored() {
      try { return normalize(storage?.getItem(STORAGE_KEY) ? parse(storage.getItem(STORAGE_KEY)) : null, wallNow()); }
      catch { persistent = false; return normalize(null, wallNow()); }
    }
    let state = stored();
    function visible() { return !doc || doc.visibilityState !== 'hidden'; }
    function engaged(perf = monoNow()) { return visible() && focused && perf - lastActivityPerf < IDLE_MS; }
    function lease() {
      try {
        const value = parse(storage?.getItem(LEASE_KEY));
        return value && typeof value.owner === 'string' && Number.isFinite(value.expires) && Number.isFinite(value.since) ? value : null;
      } catch { persistent = false; return null; }
    }
    function acquire(now = wallNow()) {
      if (!persistent) { leader = true; return true; }
      const previous = lease();
      const valid = previous && previous.expires > now && previous.expires - now < LEASE_MS * 2;
      if (valid && previous.owner !== tabId) { leader = false; return false; }
      try {
        storage.setItem(LEASE_KEY, JSON.stringify({ owner: tabId, since: previous?.owner === tabId ? previous.since : now, expires: now + LEASE_MS }));
        leader = lease()?.owner === tabId;
        if (leader) state = mergeStates(state, stored());
      } catch { persistent = false; leader = true; }
      return leader;
    }
    function release() {
      if (persistent) try { if (lease()?.owner === tabId) storage.removeItem(LEASE_KEY); } catch { persistent = false; }
      leader = false;
    }
    function renderSnapshot() {
      const days = Object.entries(state.days).sort(([a], [b]) => a.localeCompare(b)).map(([day, row]) => ({ day, activeMs: Math.floor(Math.min(dayLength(day), Object.values(row.contributions).reduce((sum, ms) => sum + ms, 0))) })).filter(row => row.activeMs > 0);
      return {
        version: 1, startedAt: state.startedAt, activeMs: days.reduce((sum, row) => sum + row.activeMs, 0),
        totalDays: days.length, days, currentSessionMs: Math.floor(currentSessionMs), lastSavedAt: state.lastSavedAt,
        persistent, isActive: started && engaged() && leader, isIdle: started && monoNow() - lastActivityPerf >= IDLE_MS,
        idleLimitMs: IDLE_MS
      };
    }
    function notify(force = false) {
      const perf = monoNow();
      if (!force && perf - lastNotifyPerf < 1000) return;
      lastNotifyPerf = perf;
      const snapshot = renderSnapshot();
      for (const callback of callbacks) { try { callback(snapshot); } catch { /* A consumer cannot stop time tracking. */ } }
      if (doc?.dispatchEvent && typeof win.CustomEvent === 'function') doc.dispatchEvent(new win.CustomEvent('wort-usage-change', { detail: snapshot }));
    }
    function persist(force = false) {
      if (!persistent) { if (force) notify(true); return; }
      try {
        state = mergeStates(state, stored());
        state.lastSavedAt = new Date(wallNow()).toISOString();
        storage.setItem(STORAGE_KEY, JSON.stringify(state));
        lastSavePerf = monoNow();
      } catch { persistent = false; }
      if (force) notify(true);
    }
    function add(startWall, duration) {
      if (!(duration > 0)) return;
      for (const part of splitDuration(startWall, duration)) {
        const row = state.days[part.day] ||= { contributions: {} };
        row.contributions[tabId] = (row.contributions[tabId] || 0) + part.activeMs;
        if (part.day < state.startedAt) state.startedAt = part.day;
      }
      currentSessionMs += duration;
    }
    function advance(lostLeaseAt) {
      if (!started) return;
      const perf = monoNow(), now = wallNow();
      const delta = Math.max(0, perf - lastPerf);
      const segmentWall = now - delta;
      if (leader && delta > 0) {
        let duration = Math.min(delta, Math.max(0, lastActivityPerf + IDLE_MS - lastPerf));
        const current = persistent ? lease() : null;
        const takenAt = Number.isFinite(lostLeaseAt) ? lostLeaseAt : current && current.owner !== tabId ? current.since : null;
        if (Number.isFinite(takenAt) && takenAt >= segmentWall && takenAt <= now) duration = Math.min(duration, takenAt - segmentWall);
        // leader only remains true while the previous segment was visible and focused.
        add(segmentWall, duration);
      }
      lastPerf = perf; lastWall = now;
    }
    function reconcile() {
      if (!started) return;
      const perf = monoNow();
      if (engaged(perf)) acquire();
      else { if (leader) persist(); release(); }
    }
    function tick() {
      advance(); reconcile();
      if (monoNow() - lastSavePerf >= SAVE_MS) persist();
      notify();
    }
    function activity(event) {
      if (!started) return;
      // Layout changes can scroll an unfocused tab; they do not prove engagement.
      if (event?.type === 'scroll' && !focused) return;
      advance(); lastActivityPerf = monoNow();
      // A touch/key event proves this iframe is being used even when mobile hasFocus is unreliable.
      if (visible()) focused = true;
      reconcile(); notify();
    }
    function hideOrBlur(event) {
      advance();
      if (event?.type === 'blur' || event?.type === 'pagehide') focused = false;
      persist(); release(); notify(true);
    }
    function focusOrShow() {
      advance(); focused = true; lastActivityPerf = monoNow(); reconcile(); notify(true);
    }
    function visibilityChange() { if (visible()) focusOrShow(); else hideOrBlur(); }
    function storageChange(event) {
      if (!started) return;
      if (event.key === LEASE_KEY) {
        const next = parse(event.newValue);
        advance(next && next.owner !== tabId ? next.since : undefined);
        if (next?.owner !== tabId) leader = false;
        reconcile();
      } else if (event.key === STORAGE_KEY) {
        state = mergeStates(state, normalize(parse(event.newValue), wallNow())); notify(true);
      }
    }
    function on(target, type, listener, settings) { if (target?.addEventListener) { target.addEventListener(type, listener, settings); listeners.push(() => target.removeEventListener(type, listener, settings)); } }
    function start() {
      if (started) return api;
      state = mergeStates(state, stored()); started = true;
      focused = typeof doc?.hasFocus === 'function' ? doc.hasFocus() : true;
      lastPerf = monoNow(); lastWall = wallNow(); lastActivityPerf = lastPerf; lastSavePerf = lastPerf; currentSessionMs = 0;
      on(doc, 'visibilitychange', visibilityChange);
      for (const type of ['pointerdown', 'touchstart', 'keydown', 'scroll']) on(doc, type, activity, { passive: true, capture: true });
      on(win, 'blur', hideOrBlur); on(win, 'focus', focusOrShow); on(win, 'pagehide', hideOrBlur); on(win, 'pageshow', focusOrShow); on(win, 'storage', storageChange);
      reconcile(); persist();
      if (setTick) timer = setTick(tick, HEARTBEAT_MS);
      notify(true); return api;
    }
    function stop() {
      if (!started) return;
      advance(); persist(); release(); started = false;
      if (timer !== null && clearTick) clearTick(timer);
      timer = null; while (listeners.length) listeners.pop()(); notify(true);
    }
    function snapshot() { advance(); reconcile(); return renderSnapshot(); }
    function subscribe(callback) { if (typeof callback !== 'function') return () => {}; callbacks.add(callback); callback(renderSnapshot()); return () => callbacks.delete(callback); }
    const api = { start, stop, snapshot, subscribe };
    return api;
  }
  const api = createTracker();
  global.WORT_USAGE = api;
  if (typeof module === 'object' && module.exports) module.exports = { createTracker, dayKey, normalize, splitDuration };
})(typeof window === 'object' ? window : globalThis);
