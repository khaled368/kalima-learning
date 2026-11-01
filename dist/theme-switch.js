/* Kalima day/night appearance, independent of Codex and cloud progress. */
(function () {
  'use strict';
  const KEY = 'kalima-display-theme';
  const root = document.documentElement;
  const labels = {
    ar: { switch: 'الوضع الليلي', day: 'تفعيل الوضع النهاري', night: 'تفعيل الوضع الليلي' },
    en: { switch: 'Dark mode', day: 'Switch to light mode', night: 'Switch to dark mode' },
    de: { switch: 'Dunkelmodus', day: 'Zum hellen Modus wechseln', night: 'Zum dunklen Modus wechseln' },
    nl: { switch: 'Donkere modus', day: 'Naar lichte modus schakelen', night: 'Naar donkere modus schakelen' }
  };

  function readPreference() {
    try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; }
    catch { return 'light'; }
  }

  function displayLanguage() {
    const code = window.WORT_COURSE?.native || root.lang || 'ar';
    return labels[code] || labels.ar;
  }

  function applyTheme(mode, remember) {
    const dark = mode === 'dark';
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    // The original Kalima stylesheet stack is dark. The two later light
    // overrides are individually disabled when dark mode is selected.
    document.querySelectorAll('link[data-kalima-light]').forEach(link => {
      link.media = dark ? 'not all' : 'all';
      link.disabled = dark;
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#061b2a' : '#ffffff');

    const control = document.getElementById('theme-toggle');
    if (control) {
      const words = displayLanguage();
      control.setAttribute('aria-checked', String(dark));
      control.setAttribute('aria-label', words.switch);
      control.setAttribute('title', dark ? words.day : words.night);
    }
    if (remember) {
      try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); } catch {}
    }
  }

  const initial = readPreference();
  // Runs in <head> before the page body is rendered, avoiding a theme flash.
  applyTheme(initial, false);

  function initializeSwitch() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    // Tap toggles normally; dragging the thumb also moves it interactively.
    // Pointer Events work for touch, mouse and pen, including iOS Safari.
    const travel = 54;
    let gesture = null;
    let ignoreClickUntil = 0;
    const clamp = x => Math.max(0, Math.min(travel, x));
    const finishGesture = (event, cancelled) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const diff = event.clientX - gesture.startX;
      const moved = gesture.moved;
      const offset = clamp(gesture.startOffset + diff);
      gesture = null;
      toggle.classList.remove('is-dragging');
      toggle.style.removeProperty('--drag-x');
      if (toggle.hasPointerCapture?.(event.pointerId)) {
        toggle.releasePointerCapture(event.pointerId);
      }
      if (cancelled || !moved) return;
      // Ignore the synthetic click fired after dragging, but never block later taps.
      ignoreClickUntil = Date.now() + 300;
      const next = diff > 14 ? 'dark' : diff < -14 ? 'light'
        : offset >= travel / 2 ? 'dark' : 'light';
      applyTheme(next, true);
    };
    toggle.addEventListener('pointerdown', event => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      gesture = {
        id: event.pointerId,
        startX: event.clientX,
        startOffset: root.getAttribute('data-theme') === 'dark' ? travel : 0,
        moved: false
      };
      toggle.classList.add('is-dragging');
      toggle.style.setProperty('--drag-x', gesture.startOffset + 'px');
      toggle.setPointerCapture?.(event.pointerId);
    });
    toggle.addEventListener('pointermove', event => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const diff = event.clientX - gesture.startX;
      if (Math.abs(diff) > 7) gesture.moved = true;
      toggle.style.setProperty('--drag-x', clamp(gesture.startOffset + diff) + 'px');
    });
    toggle.addEventListener('pointerup', event => finishGesture(event, false));
    toggle.addEventListener('pointercancel', event => finishGesture(event, true));
    toggle.addEventListener('click', event => {
      if (Date.now() < ignoreClickUntil && event.detail !== 0) {
        ignoreClickUntil = 0;
        return;
      }
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
    });
    applyTheme(root.getAttribute('data-theme'), false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSwitch, { once: true });
  } else initializeSwitch();
})();
