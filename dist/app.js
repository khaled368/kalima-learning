'use strict';

const COURSE = WORT_COURSE,
  NATIVE = COURSE.native,
  TARGET = COURSE.target,
  LOCALE = COURSE.locale;
const t = (source, params) => WORT_I18N.t(source, params);
const uiHtml = html => WORT_I18N.markup(String(html ?? '').replaceAll('${TARGET}',TARGET).replaceAll('${NATIVE}',NATIVE).replaceAll('${COURSE.dir(TARGET)}',COURSE.dir(TARGET)).replaceAll('${COURSE.dir(NATIVE)}',COURSE.dir(NATIVE)));
const storageKey = base => COURSE.key(base);
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[c]);
const SPEAKER_ICON = '<svg class="reference-speaker" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4V9Z"/><path d="M17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
const articleHtml = article => `<span class="article" data-article="${esc(String(article).toLocaleLowerCase())}">${esc(article)}</span>`;
const LEVELS = [{
  code: 'A1',
  name: t("مبتدئ"),
  description: t("الأساسيات والتواصل في الحياة اليومية")
}, {
  code: 'A2',
  name: t("أساسي"),
  description: t("توسيع مفردات المواقف اليومية والعمل والسفر")
}, {
  code: 'B1',
  name: t("متوسط"),
  description: t("التجارب والآراء والتعبير عن الأفكار")
}, {
  code: 'B2',
  name: t("فوق المتوسط"),
  description: t("نقاشات أوسع ولغة أكثر تفصيلًا")
}, {
  code: 'C1',
  name: t("متقدّم"),
  description: t("مفردات دقيقة للتحليل والنقاش المتقدّم")
}];
const POS = {
  noun: t("اسم"),
  verb: t("فعل"),
  adjective: t("صفة"),
  adverb: t("ظرف"),
  pronoun: t("ضمير"),
  preposition: t("حرف جر"),
  conjunction: t("حرف ربط"),
  interjection: t("تعجّب"),
  other: t("كلمة")
};
const cache = new Map();
const wordMap = new Map();
let manifest = null,
  activeLevel = 'A1',
  panel = 'library',
  pageSize = 24,
  currentWord = null,
  wordTab = 'meaning';
let badgesReturnPanel = 'library';
let calendarView = null;
const DAILY_GOAL = 20;
let session = null,
  toastTimer,
  loadRequest = 0;
let wordAdvanceTimer = null,
  wordAdvanceVersion = 0;
let wordVisitHistory = [];
const WORD_ADVANCE_DELAY = 650;
const safeRead = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const storedSet = key => {
  const value = safeRead(key, []);
  return new Set(Array.isArray(value) ? value.filter(id => typeof id === 'number' || typeof id === 'string').map(id => typeof id === 'string' && /^\d+$/.test(id) && Number(id) < 90 ? Number(id) : id) : []);
};
const saved = storedSet(storageKey('wort-saved')),
  learned = storedSet(storageKey('wort-learned')),
  reviewMistakes = WORT_REVIEW_MISTAKES;
const day = WORT_HISTORY.dayKey();
const oldToday = safeRead(storageKey('wort-today'), {});
const today = {
  day,
  ids: oldToday?.day === day && Array.isArray(oldToday.ids) ? [...new Set(oldToday.ids)] : []
};
WORT_HISTORY.init([...learned], oldToday);
let storageAvailable = true;
let analyticsView = null,
  audioRequest = 0,
  audioButton = null;
let verbDataReady = false,
  verbLoading = null,
  verbTense = 'present';
let cardView = safeRead('wort-card-view', 'compact');
if (!['compact', 'grid'].includes(cardView)) cardView = 'compact';
const totalWords = () => manifest?.levels.reduce((n, l) => n + l.count, 0) || 0;
function idLevel(id) {
  return typeof id === 'number' && id >= 0 && id < 90 ? LEVELS[Math.floor(id / 18)].code : String(id).split(':')[0];
}
function countLearned(code) {
  return [...learned].filter(id => idLevel(id) === code).length;
}
function refreshToday() {
  const current = WORT_HISTORY.dayKey();
  today.day = current;
  today.ids = (WORT_HISTORY.snapshot()?.events || []).filter(event => event.day === current).map(event => event.id);
}
function remember() {
  // Preserve explicit removal of learned words; do not re-add stale storage IDs.
  WORT_HISTORY.sync([...learned]);
  refreshToday();
  try {
    localStorage.setItem(storageKey('wort-saved'), JSON.stringify([...saved]));
    localStorage.setItem(storageKey('wort-learned'), JSON.stringify([...learned]));
    localStorage.setItem(storageKey('wort-today'), JSON.stringify(today));
  } catch {
    if (storageAvailable) toast(t("التخزين غير متاح. سيبقى تقدّمك في هذه الجلسة فقط."));
    storageAvailable = false;
  }
  updateProgress();
}
function toast(text) {
  clearTimeout(toastTimer);
  $('#toast').textContent = text;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => $('#toast').hidden = true, 3200);
}
function status(text) {
  $('#app-status').textContent = text;
}
async function loadLevel(code) {
  if (cache.has(code)) return cache.get(code);
  const list = await WORT_CONTENT.loadLevel(code, manifest);
  if (!Array.isArray(list)) throw new Error(t("تعذّر قراءة بيانات المفردات."));
  cache.set(code, list);
  list.forEach(word => wordMap.set(word.id, word));
  return list;
}
function buildLevels() {
  $('#level-tabs').innerHTML = uiHtml(LEVELS.map(level => `<button class="level-tab ${level.code === activeLevel ? 'active' : ''}" data-level="${level.code}" aria-pressed="${level.code === activeLevel}"><strong dir="ltr">${level.code}</strong><small>${level.name}</small></button>`).join(''));
  $('#training-level').innerHTML = uiHtml(LEVELS.map(level => `<option value="${level.code}">${level.code} · ${level.name}</option>`).join(''));
}
function updateProgress() {
  refreshToday();
  const total = totalWords(),
    done = Math.min(total, learned.size),
    percent = total ? done / total * 100 : 0;
  $('#overall-count').textContent = `${done.toLocaleString(LOCALE)} / ${total.toLocaleString(LOCALE)}`;
  $('#overall-percent').textContent = t("{v0}٪", {
    v0: percent.toLocaleString(LOCALE, {
      maximumFractionDigits: 1
    })
  });
  $('#overall-bar').style.width = `${percent}%`;
  $('#overall-bar').parentElement.setAttribute('aria-valuenow', percent.toFixed(1));
  const levelCount = manifest?.levels.find(level => level.code === activeLevel)?.count || 0;
  const levelDone = Math.min(levelCount, countLearned(activeLevel));
  $('#level-learned').textContent = t("{v0} من {v1} كلمة تعلّمتها", {
    v0: levelDone,
    v1: levelCount
  });
  $('#level-bar').style.width = `${levelCount ? levelDone / levelCount * 100 : 0}%`;
  $('#level-bar').parentElement.setAttribute('aria-valuenow', String(levelCount ? Math.round(levelDone / levelCount * 100) : 0));
  $('#daily-goal-count').textContent = `${today.ids.length.toLocaleString(LOCALE)} / ${DAILY_GOAL.toLocaleString(LOCALE)}`;
  $('#daily-goal-status').textContent = today.ids.length >= DAILY_GOAL ? t("اكتمل الهدف \xB7 واصل بكلمة جديدة") : t("افتح كلمة جديدة وابدأ التعلّم");
  $('#daily-goal-button').classList.toggle('is-complete', today.ids.length >= DAILY_GOAL);
   globalThis.WORT_DAILY_REMINDERS?.syncProgress(today.day,today.ids.length);
  $('#stats-learned').textContent = done.toLocaleString(LOCALE);
  $('#stats-today').textContent = today.ids.length.toLocaleString(LOCALE);
  $('#stats-saved').textContent = saved.size.toLocaleString(LOCALE);
  updateOwnedShield();
  if (panel === 'badges') renderBadges();
  updateReviewAvailability();
  if (panel === 'progress') renderProgress();
}
async function selectLevel(code) {
  // Keep the upcoming vocabulary list folded whenever the learner changes levels.
  // It can still be expanded manually, and search/filter actions open it when needed.
  $('#vocabulary-disclosure').open = false;
  activeLevel = code;
  pageSize = 24;
  const request = ++loadRequest;
  document.querySelectorAll('[data-level]').forEach(b => {
    b.classList.toggle('active', b.dataset.level === code);
    b.setAttribute('aria-pressed', String(b.dataset.level === code));
  });
  const level = LEVELS.find(level => level.code === code);
  $('#level-title').textContent = `${code} · ${level.name}`;
  $('#level-caption').textContent = t("قسم المستوى");
  $('#level-description').textContent = level.description;
  $('#level-count').textContent = t("{v0} كلمة", {
    v0: manifest?.levels.find(l => l.code === code)?.count || 0
  });
  $('#training-level').value = code;
  $('#search').value = '';
  $('#pos-filter').value = 'all';
  $('#cards').innerHTML = uiHtml('<p class="empty">جارٍ تحميل البطاقات…</p>');
  $('#load-more').hidden = true;
  status('');
  updateProgress();
  try {
    await loadLevel(code);
    if (request !== loadRequest) return;
    renderCards();
  } catch (error) {
    if (request !== loadRequest) return;
    $('#cards').innerHTML = uiHtml('<div class="empty">تعذّر تحميل الكلمات. <button class="secondary" id="retry-level">حاول مرة أخرى</button></div>');
    $('#retry-level').onclick = () => selectLevel(code);
    status(error.message);
  }
}
async function startDailyGoal() {
  const button = $('#daily-goal-button'),
    code = activeLevel;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  try {
    const words = await loadLevel(code);
    if (panel !== 'library' || activeLevel !== code) return;
    const word = words.find(word => !learned.has(word.id));
    if (!word) {
      toast(t("أكملت كلمات هذا المستوى. اختر مستوى آخر أو راجع ما تعلّمته."));
      return;
    }
    pageSize = 24;
    $('#search').value = '';
    $('#pos-filter').value = 'all';
    renderCards();
    openWord(word);
  } catch (error) {
    toast(error.message || t("تعذّر فتح كلمات الهدف. حاول مجددًا."));
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}
function normalizeSearch(value) {
  return String(value).normalize('NFC').toLocaleLowerCase().replace(/[ً-ٰٟـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ß/g, 'ss');
}
function matchingWords() {
  const query = normalizeSearch($('#search').value.trim()),
    pos = $('#pos-filter').value;
  const list = (cache.get(activeLevel) || []).filter(word => !learned.has(word.id) && (pos === 'all' || (pos === 'other' ? !['noun', 'verb', 'adjective'].includes(word.pos) : word.pos === pos)) && (!query || normalizeSearch(`${word.article || ''} ${word.german} ${word.arabic}`).includes(query)));
  return list;
}
function setCardView(view) {
  cardView = view;
  document.body.dataset.cardView = view;
  document.querySelectorAll('[data-card-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.cardView === view)));
  try {
    localStorage.setItem('wort-card-view', JSON.stringify(view));
  } catch {}
}
function card(word) {
  const full = `${word.article ? word.article + ' ' : ''}${word.german}`;
  return `<article class="word-card" data-card-id="${esc(word.id)}"><button class="word-open" data-open="${esc(word.id)}" aria-label="تفاصيل ${esc(full)}"><span class="word-pos"><span>${POS[word.pos] || POS.other} <span class="word-level">${word.level}</span></span>${learned.has(word.id) ? '<span class="learned-badge" aria-label="تعلّمتها">✓</span>' : '<span class="card-hint" aria-hidden="true">التفاصيل ←</span>'}</span><span class="word-pair"><span class="word-head" lang="${TARGET}" dir="${COURSE.dir(TARGET)}">${word.article ? `${articleHtml(word.article)} ` : ''}${esc(word.german)}</span><span class="translation" lang="${NATIVE}" dir="${COURSE.dir(NATIVE)}">${esc(word.arabic)}</span></span></button><div class="card-actions"><button class="save-button ${saved.has(word.id) ? 'saved' : ''}" data-save="${esc(word.id)}" aria-label="${saved.has(word.id) ? t("إزالة من المحفوظات") : t("حفظ الكلمة")}" aria-pressed="${saved.has(word.id)}">${saved.has(word.id) ? '★' : '☆'}</button><button class="icon-button" data-speak="${esc(word.id)}" aria-label="استمع إلى ${esc(word.german)}">${SPEAKER_ICON}</button></div></article>`;
}
function renderCards() {
  const list = matchingWords();
  $('#results-count').textContent = t("{v0} كلمة غير متعلّمة \xB7 {v1} معروضة", {
    v0: list.length.toLocaleString(LOCALE),
    v1: Math.min(pageSize, list.length)
  });
  $('#cards').innerHTML = uiHtml(list.length ? list.slice(0, pageSize).map(card).join('') : $('#search').value || $('#pos-filter').value !== 'all' ? '<div class="empty">لم نجد كلمات غير متعلّمة تطابق البحث. تجد الكلمات السابقة في المراجعة.</div>' : '<div class="empty"><h3>أكملت كلمات هذا المستوى 🌿</h3><p>يمكنك مراجعتها أو الانتقال إلى مستوى آخر.</p><button class="secondary" data-review-learned>مراجعة الكلمات</button></div>');
  $('#load-more').hidden = pageSize >= list.length;
}
async function showPanel(name) {
  if (name !== panel) cancelWordAdvance();
  if (name === 'badges' && panel !== 'badges') badgesReturnPanel = panel;
  if (name !== panel) stopSpeech();
  panel = name;
  document.querySelectorAll('main > .panel').forEach(p => p.hidden = p.id !== `${name}-panel`);
  document.querySelectorAll('[data-panel]').forEach(b => {
    b.classList.toggle('active', b.dataset.panel === name);
    if (b.dataset.panel === name) b.setAttribute('aria-current', 'page');else b.removeAttribute('aria-current');
  });
  $('#home-shield-button').setAttribute('aria-expanded', String(name === 'badges'));
  updateOwnedShield();
  status('');
  window.scrollTo({
    top: 0,
    behavior: 'instant'
  });
  if (name === 'training') updateReviewAvailability();
  if (name === 'saved') await renderSaved();
  if (name === 'progress') renderProgress();
  if (name === 'badges') renderBadges();
  if (name === 'writing' && !$('#writing-content').dataset.mounted) {
    WORT_WRITING.mount($('#writing-content'));
    $('#writing-content').dataset.mounted = 'true';
  }
  if (name === 'sentences' && !$('#sentences-content').dataset.mounted) {
    WORT_SENTENCES.mount($('#sentences-content'));
    $('#sentences-content').dataset.mounted = 'true';
  }
}
async function renderSaved() {
  $('#saved-count').textContent = t("{v0} كلمة محفوظة", {
    v0: saved.size
  });
  if (!saved.size) {
    $('#saved-cards').innerHTML = uiHtml('<div class="empty">لم تحفظ كلمات بعد. اضغط النجمة على أي بطاقة لتجدها هنا.</div>');
    return;
  }
  $('#saved-cards').innerHTML = uiHtml('<p class="empty">جارٍ تحميل محفوظاتك…</p>');
  try {
    await Promise.all([...new Set([...saved].map(idLevel))].filter(code => LEVELS.some(l => l.code === code)).map(loadLevel));
    $('#saved-cards').innerHTML = uiHtml([...saved].map(id => wordMap.get(id)).filter(Boolean).map(card).join(''));
  } catch (error) {
    $('#saved-cards').innerHTML = uiHtml('<div class="empty">تعذّر تحميل بعض المحفوظات. <button class="secondary" id="retry-saved">حاول مجددًا</button></div>');
    $('#retry-saved').onclick = renderSaved;
    status(error.message);
  }
}
function findWord(value) {
  return wordMap.get(value) || wordMap.get(Number(value));
}
function toggleSave(word) {
  if (saved.has(word.id)) {
    saved.delete(word.id);
    toast(t("أُزيلت من المحفوظات"));
  } else {
    saved.add(word.id);
    toast(t("حُفظت الكلمة"));
  }
  remember();
  renderCards();
  if (panel === 'saved') renderSaved();
  if (currentWord?.id === word.id) updateWordControls();
}
function learnWord(word) {
  if (learned.has(word.id)) return;
  const previousTotal = learned.size;
  learned.add(word.id);
  WORT_HISTORY.record(word);
  remember();
  // This is called inside the real "learned" click for Safari audio permission.
  // It celebrates only a newly crossed, manifest-defined shield milestone.
  globalThis.WORT_RANK_CELEBRATION?.onLearn(previousTotal, learned.size, manifest?.shields);
  renderCards();
  if (panel === 'saved') renderSaved();
  toast(t("كلمة جديدة في رصيدك \u2728"));
  if (currentWord?.id === word.id) updateWordControls();
}
function cancelWordAdvance() {
  clearTimeout(wordAdvanceTimer);
  wordAdvanceTimer = null;
  wordAdvanceVersion++;
  $('#word-dialog').classList.remove('word-turn-out', 'word-turn-in');
}
function markCurrentWord() {
  const word = currentWord,
    dialog = $('#word-dialog');
  if (!word || !dialog.open) return;
  if (learned.has(word.id)) {
    // Tapping the green button (including during the auto-advance animation)
    // reverses learning. History and today's goal are reconciled in remember().
    cancelWordAdvance();
    learned.delete(word.id);
    reviewMistakes.forget(word.id);
    remember();
    renderCards();
    if (panel === 'saved') renderSaved();
    updateWordControls();
    toast(t("أُعيدت الكلمة إلى غير المتعلّمة"));
    return;
  }
  if (wordAdvanceTimer !== null) return;
  cancelWordAdvance();
  const version = wordAdvanceVersion;
  learnWord(word);
  dialog.style.setProperty('--word-turn-duration', WORD_ADVANCE_DELAY + 'ms');
  dialog.classList.add('word-turn-out');
  wordAdvanceTimer = setTimeout(() => {
    wordAdvanceTimer = null;
    if (version !== wordAdvanceVersion || !dialog.open || currentWord?.id !== word.id) return;
    nextWord();
    if (dialog.open) dialog.classList.add('word-turn-in');
  }, WORD_ADVANCE_DELAY);
}
function speak(text, button = null, lang = TARGET) {
  if (button && audioButton === button && ['loading', 'playing'].includes(WORT_AUDIO.state.state)) {
    stopSpeech();
    return Promise.resolve(false);
  }
  const request = ++audioRequest;
  if (audioButton) {
    audioButton.removeAttribute('aria-busy');
    audioButton.classList.remove('audio-playing');
  }
  audioButton = button;
  if (button) button.setAttribute('aria-busy', 'true');
  const playing = WORT_AUDIO.speak(text, {
    lang,
    onStatus: event => {
      if (request !== audioRequest) return;
      const state = typeof event === 'string' ? event : event.state;
      // Loading is already indicated by aria-busy on the tapped audio button.
      // Do not show the "first time" toast on every playback request.
      if (state === 'playing' && button) button.classList.add('audio-playing');
    }
  });
  return Promise.resolve(playing).catch(error => {
    if (request === audioRequest) toast(error.message || t("تعذّر تشغيل الصوت. حاول مرة أخرى."));
    return false;
  }).finally(() => {
    if (request === audioRequest) {
      if (button) {
        button.removeAttribute('aria-busy');
        button.classList.remove('audio-playing');
      }
      audioButton = null;
    }
  });
}
function stopSpeech() {
  audioRequest++;
  if (audioButton) {
    audioButton.removeAttribute('aria-busy');
    audioButton.classList.remove('audio-playing');
    audioButton = null;
  }
  WORT_AUDIO.stop();
}
function updateWordControls() {
  const isSaved = saved.has(currentWord.id);
  $('#word-save').textContent = isSaved ? '★' : '☆';
  $('#word-save').classList.toggle('saved', isSaved);
  $('#word-save').title = isSaved ? t("إزالة من المحفوظات") : t("حفظ الكلمة");
  $('#word-save').setAttribute('aria-pressed', String(isSaved));
  $('#word-save').setAttribute('aria-label', isSaved ? t("إزالة من المحفوظات") : t("حفظ الكلمة"));
  const isLearned = learned.has(currentWord.id);
  // The green learned state is a reversible action, not a disabled button.
  $('#mark-word').disabled = false;
  $('#mark-word').classList.toggle('is-learned', isLearned);
  $('#mark-word').setAttribute('aria-pressed', String(isLearned));
  $('#mark-word').textContent = isLearned ? t("إلغاء تعلّمها ↶") : t("تعلّمتها \u2713");
}
function openWord(word, recordVisit = true) {
  const dialog = $('#word-dialog');
  if (!dialog.open) wordVisitHistory = [];
  else if (recordVisit && currentWord && currentWord.id !== word.id) {
    wordVisitHistory.push(currentWord);
    if (wordVisitHistory.length > 250) wordVisitHistory.shift();
  }
  cancelWordAdvance();
  currentWord = word;
  wordTab = 'meaning';
  verbTense = 'present';
  $('#word-title').textContent = word.german;
  updateWordControls();
  renderWord();
  if (!$('#word-dialog').open) $('#word-dialog').showModal();
  $('#word-dialog').scrollTop = 0;
}
function exampleHtml(example) {
  return `<article class="example-card"><div class="example-de" data-content lang="${TARGET}" dir="${COURSE.dir(TARGET)}">${esc(example.de)}</div>${example.ar ? `<p class="example-ar" data-content lang="${NATIVE}" dir="${COURSE.dir(NATIVE)}">${esc(example.ar)}</p>` : ''}<button type="button" class="icon-button reference-example-audio" data-example-speak="${esc(example.de)}" aria-label="استمع إلى المثال" title="استمع إلى المثال">${SPEAKER_ICON}</button>${example.source ? `<p class="source-note">${example.generated ? t("مثال تعليمي مولَّد في المصدر \xB7 ") : ''}${example.sourceUrl ? `<a href="${esc(example.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(example.source)}</a>` : esc(example.source)}${example.license ? ' · ' + esc(example.license) : ''}</p>` : ''}</article>`;
}
function renderInlineVerb(word) {
  if (TARGET !== 'de') {
    const node = $('#inline-conjugation');
    if (node) node.innerHTML = uiHtml(WORT_GRAMMAR.render(word, {
      tense: verbTense
    }));
    return;
  }
  const current = () => currentWord?.id === word.id && wordTab === 'meaning' && $('#inline-conjugation');
  if (verbDataReady) {
    if (current()) $('#inline-conjugation').innerHTML = uiHtml(verbGrammarHtml(word));
    return;
  }
  if (current()) $('#inline-conjugation').innerHTML = uiHtml('<p class="source-note">جارٍ تحميل تصريف الأفعال…</p>');
  if (!verbLoading) verbLoading = WORT_VERBS.load().then(() => {
    verbDataReady = true;
  }).catch(error => {
    verbLoading = null;
    throw error;
  });
  verbLoading.then(() => {
    if (current()) $('#inline-conjugation').innerHTML = uiHtml(verbGrammarHtml(word));
  }).catch(() => {
    if (current()) $('#inline-conjugation').innerHTML = uiHtml('<div class="empty">تعذّر تحميل التصريف. <button class="secondary" data-retry-verbs>حاول مجددًا</button></div>');
  });
}
function renderWord() {
  const word = currentWord;
  document.querySelectorAll('[data-word-tab]').forEach(b => {
    const active = b.dataset.wordTab === wordTab;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
    b.tabIndex = active ? 0 : -1;
  });
  $('#word-content').setAttribute('aria-labelledby', `${wordTab}-tab`);
  $('#word-summary').innerHTML = uiHtml(`<div class="reference-word-copy"><div class="reference-word-heading"><h2 lang="${TARGET}" dir="${COURSE.dir(TARGET)}">${word.article ? articleHtml(word.article) + ' ' : ''}${esc(word.german)}</h2><button class="icon-button reference-word-audio" data-pronounce aria-label="نطق الكلمة">${SPEAKER_ICON}</button></div><p class="definition" lang="${NATIVE}" dir="${COURSE.dir(NATIVE)}">${esc(word.arabic)}</p><div class="reference-word-chips"><span>${POS[word.pos] || POS.other}</span><span lang="${TARGET}" dir="${COURSE.dir(TARGET)}">${word.level}</span></div></div>`);
  const examples = word.examples || [],
    hasExtraGrammar = word.pos !== 'verb' && Boolean(word.declensionStem || word.forms?.length || word.verbForms);
  if (wordTab === 'meaning') {
    $('#word-content').innerHTML = uiHtml(`<section class="reference-meaning"><div class="section-heading"><h3>الكلمة في سياقها</h3>${examples.length ? '<button class="secondary" data-detail-examples>كل الأمثلة ←</button>' : ''}</div>${examples.length ? exampleHtml(examples[0]) : '<p class="source-note">لا يتوفر مثال مناسب مرتبط بهذه الكلمة في المصدر الحالي.</p>'}${hasExtraGrammar ? '' : degreeHtml(word)}${!hasExtraGrammar && word.plural ? `<p class="source-note">الجمع: <b lang="${TARGET}" dir="${COURSE.dir(TARGET)}">${esc(word.plural)}</b></p>` : ''}</section>${word.pos === 'verb' ? '<div id="inline-conjugation"></div>' : hasExtraGrammar || (TARGET === 'de' && word.pos === 'noun') ? grammarHtml(word) : ''}${word.note ? `<p class="source-note">${esc(t(word.note))}</p>` : ''}`);
    if (word.pos === 'verb') renderInlineVerb(word);
  } else if (wordTab === 'examples') {
    $('#word-content').innerHTML = uiHtml(`<div class="section-heading"><h2>أمثلة على <b lang="${TARGET}">${esc(word.german)}</b></h2><span>${examples.length} أمثلة</span></div>${examples.length ? examples.map(exampleHtml).join('') : '<div class="empty">لا تتوفر أمثلة تطابق هذه الكلمة في المصدر الحالي.</div>'}`);
  }
  $('#word-content').scrollTop = 0;
}
function degreeHtml(word) {
  if (word.pos !== 'adjective') return '';
  const degrees = [[t("الصفة"), word.german], [t("المقارنة"), word.comparative], [t("التفضيل"), word.superlative]].filter(d => d[1]);
  return `<div class="degree-row">${degrees.map(([label, value]) => `<div class="degree-item"><small>${label}</small><strong lang="${TARGET}" dir="${COURSE.dir(TARGET)}">${esc(value)}</strong></div>`).join('')}</div>`;
}
// German case names are the learning terms; Arabic explanations are optional
// and never replace the actual grammatical name.
const CASES = [
  ['Nominativ', 'حالة الفاعل'],
  ['Genitiv', 'حالة الإضافة'],
  ['Dativ', 'حالة المفعول غير المباشر'],
  ['Akkusativ', 'حالة المفعول المباشر']
];
// Keep inflection arrays indexed as Nominativ, Genitiv, Dativ, Akkusativ;
// display rows in learner order: Nominativ, Akkusativ, Dativ, Genitiv.
const CASE_ORDER = [0, 3, 2, 1];
const GENDERS_DE = [
  ['Maskulin', 'gender-m'], ['Feminin', 'gender-f'],
  ['Neutrum', 'gender-n'], ['Plural', 'gender-pl']
];
const DEFINITE_ARTICLES = [
  ['der', 'die', 'das', 'die'],
  ['des', 'der', 'des', 'der'],
  ['dem', 'der', 'dem', 'den'],
  ['den', 'die', 'das', 'die']
];
// Irregular nouns are handled explicitly. Unknown endings never use made-up forms.
const WEAK_NOUNS=Object.freeze({
 Mensch:'Menschen',Junge:'Jungen',Kollege:'Kollegen',Kunde:'Kunden',Student:'Studenten',
 Patient:'Patienten',Präsident:'Präsidenten',Polizist:'Polizisten',Journalist:'Journalisten',
 Tourist:'Touristen',Elefant:'Elefanten',Prinz:'Prinzen',Herr:'Herrn',Nachbar:'Nachbarn',
 Löwe:'Löwen',Bär:'Bären',Bauer:'Bauern',Held:'Helden',Soldat:'Soldaten',
 Pilot:'Piloten',Fotograf:'Fotografen',Architekt:'Architekten',Experte:'Experten',
 Name:'Namen',Gedanke:'Gedanken',Wille:'Willen',Frieden:'Frieden',Buchstabe:'Buchstaben'
});
function nounDeclensionForms(word){
 const name=String(word.german||'').trim();
 const gender=word.article==='der'?0:word.article==='die'?1:word.article==='das'?2:-1;
 const rawPlural=String(word.plural||'').trim().replace(/^die\s+/i,'');
 const plural=/^(?:-|—|kein(?:e|en)?\s+Plural|ohne\s+Plural)$/i.test(rawPlural)?'':rawPlural;
 if(!name||gender<0)return null;
 const weak=gender===0?WEAK_NOUNS[name]:null;
 const knownGenitive=name==='Name'?'Namens':name==='Wille'?'Willens':
   name==='Gedanke'?'Gedankens':name==='Frieden'?'Friedens':null;
 const explicitGenitive=String(word.grammar?.genitive||word.genitive||'').trim().replace(/^(?:des|der)\s+/i,'');
 // Strong endings are usable only for ordinary nouns; ambiguous forms stay blank.
 const indeclinable=/ismus$/i.test(name)||['Status','Modus','Bonus','Zirkus','Fokus','Rhythmus','Kaktus'].includes(name);
 const regularGenitive=indeclinable?name:gender===0&&/e$/i.test(name)?null:
   /nis$/i.test(name)?name+'ses':
   name+(/(?:s|ß|x|z|tz|sch)$/i.test(name)||
     ((name.match(/[aeiouäöü]+/gi)||[]).length===1&&!/(?:chen|lein)$/i.test(name))?'es':'s');
 const genitive=gender===1?name:explicitGenitive||knownGenitive||weak||regularGenitive;
 const dativePlural=plural?(/[ns]$/i.test(plural)?plural:plural+'n'):null;
 return {gender,singular:[name,weak||name,weak||name,genitive],
   plural:plural?[plural,plural,dativePlural,plural]:null};
}
function nounCaseReference(word) {
 const forms=nounDeclensionForms(word);
 const active=forms?.gender??-1;
 const name=String(word.german||'').trim();
 const actual=forms?`<section class="grammar-section noun-word-declension">
   <h3>تصريف الكلمة <b lang="de" dir="ltr">${esc(name)}</b></h3>
   <table class="noun-forms-table" dir="ltr">
     <thead><tr><th scope="col" lang="de">Kasus</th><th scope="col" lang="de">Singular</th><th scope="col" lang="de">Plural</th></tr></thead>
     <tbody>${CASE_ORDER.map(index=>{
       // CASE_ORDER maps case-table indices to the learner-facing noun-form order.
       const nounIndex=CASE_ORDER[index];
       const singular=forms.singular[nounIndex];
       const plural=forms.plural?.[nounIndex];
       return `<tr><th scope="row" lang="de">${CASES[index][0]}</th>
         <td lang="de" class="${GENDERS_DE[active][1]}">${singular?`<span class="case-article">${DEFINITE_ARTICLES[index][active]}</span> ${esc(singular)}`:'—'}</td>
         <td lang="de" class="gender-pl">${plural?`<span class="case-article">${DEFINITE_ARTICLES[index][3]}</span> ${esc(plural)}`:'—'}</td></tr>`;
     }).join('')}</tbody>
   </table>
   <p class="grammar-reference-note">— تعني عدم توفر صيغة مؤكدة؛ بعض الأسماء لها تصريفات شاذة.</p>
 </section>`:'';
 return `${actual}<section class="grammar-section noun-case-reference">
   <h3>أدوات التعريف حسب الحالة الإعرابية</h3>
   <div class="noun-case-scroll"><table class="noun-case-table" dir="ltr">
   <thead><tr><th scope="col" lang="de">Kasus</th>${GENDERS_DE.map(([label,color],index)=>
     `<th scope="col" lang="de" class="${color}${index===active?' is-current':''}">${label}</th>`).join('')}</tr></thead>
   <tbody>${CASE_ORDER.map(index=>`<tr>
      <th scope="row"><span lang="de">${CASES[index][0]}</span>${NATIVE==='ar'?`<small>${CASES[index][1]}</small>`:''}</th>
      ${GENDERS_DE.map(([_,color],gender)=>
        `<td lang="de" class="${color}${gender===active?' is-current':''}">${DEFINITE_ARTICLES[index][gender]}</td>`).join('')}
   </tr>`).join('')}</tbody></table></div>
 </section>`;
}
function adjectiveTables(word) {
  const stem = word.declensionStem;
  const sets = [[t("تصريف قوي \u2014 بدون أداة"), [['er', 'en', 'em', 'en'], ['e', 'er', 'er', 'e'], ['es', 'en', 'em', 'es'], ['e', 'er', 'en', 'e']], null], [t("تصريف ضعيف \u2014 مع أداة التعريف"), [['e', 'en', 'en', 'en'], ['e', 'en', 'en', 'e'], ['e', 'en', 'en', 'e'], ['en', 'en', 'en', 'en']], [['der', 'des', 'dem', 'den'], ['die', 'der', 'der', 'die'], ['das', 'des', 'dem', 'das'], ['die', 'der', 'den', 'die']]], [t("تصريف مختلط \u2014 مع أداة التنكير"), [['er', 'en', 'en', 'en'], ['e', 'en', 'en', 'e'], ['es', 'en', 'en', 'es'], ['en', 'en', 'en', 'en']], [['ein', 'eines', 'einem', 'einen'], ['eine', 'einer', 'einer', 'eine'], ['ein', 'eines', 'einem', 'ein'], ['keine', 'keiner', 'keinen', 'keine']]]];
  // Compact 4x4 matrices replace 12 stacked gender blocks.
  // Expand one declension type at a time using native accessible details.
  return `<div class="declension-sets">${sets.map(([title, endings, articles], setIndex) =>
    `<details class="declension-set"${setIndex === 0 ? ' open' : ''}>
      <summary>${title}</summary>
      <div class="declension-table-scroll" role="region" aria-label="${title}" tabindex="0">
        <table class="declension-table" dir="ltr">
          <thead><tr><th scope="col" lang="de">Kasus</th>
            ${GENDERS_DE.map(([label, color]) => `<th scope="col" lang="de" class="${color}">${label}</th>`).join('')}
          </tr></thead>
          <tbody>${CASE_ORDER.map(caseIndex => `<tr>
            <th scope="row" lang="de"><span>${CASES[caseIndex][0]}</span>${NATIVE === 'ar' ?
              `<small lang="ar" dir="rtl">${CASES[caseIndex][1]}</small>` : ''}</th>
            ${GENDERS_DE.map(([_, color], gender) => `<td lang="de" class="${color}">
              ${articles ? `<span class="declension-article">${esc(articles[gender][caseIndex])}</span> ` : ''}
              <span class="declension-stem">${esc(stem)}</span><span class="ending">${endings[gender][caseIndex]}</span>
              </td>`).join('')}
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </details>`).join('')}</div>
    <section class="grammar-section"><h3>مسند — بدون نهاية إعرابية</h3>
      <div class="example-card" lang="${TARGET}" dir="${COURSE.dir(TARGET)}">er ist ${esc(word.german)} · sie ist ${esc(word.german)} · es ist ${esc(word.german)}<br>sie sind ${esc(word.german)}</div>
    </section>`;
}
function addedLetters(base, text) {
  const a = Array.from(base.toLocaleLowerCase()),
    b = Array.from(text.toLocaleLowerCase());
  const rows = Array.from({
    length: a.length + 1
  }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) rows[i][j] = a[i] === b[j] ? rows[i + 1][j + 1] + 1 : Math.max(rows[i + 1][j], rows[i][j + 1]);
  const same = new Set();
  let i = 0,
    j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      same.add(j);
      i++;
      j++;
    } else if (rows[i + 1][j] >= rows[i][j + 1]) i++;else j++;
  }
  const chars = Array.from(text);
  let result = '',
    buffer = '',
    changed = null;
  for (let index = 0; index < chars.length; index++) {
    const mark = !same.has(index) && /\p{L}/u.test(chars[index]);
    if (changed !== null && mark !== changed) {
      result += changed ? `<span class="verb-change">${esc(buffer)}</span>` : esc(buffer);
      buffer = '';
    }
    changed = mark;
    buffer += chars[index];
  }
  return result + (changed ? `<span class="verb-change">${esc(buffer)}</span>` : esc(buffer));
}
function verbStem(infinitive, prefix = '') {
  let base = String(infinitive).replace(/^sich\s+/, '');
  if (prefix && base.startsWith(prefix)) base = base.slice(prefix.length);
  if (base.endsWith('eln')) return base.slice(0, -3) + 'l';
  return base.endsWith('en') ? base.slice(0, -2) : base.endsWith('n') ? base.slice(0, -1) : base;
}
function coloredVerbForm(entry, form, tense) {
  const prefix = entry.separablePrefix || '';
  const stem = verbStem(entry.infinitive, prefix);
  const neutral = new Set(['mich', 'dich', 'sich', 'uns', 'euch']);
  const auxiliaries = new Set(['habe', 'hast', 'hat', 'haben', 'habt', 'bin', 'bist', 'ist', 'sind', 'seid']);
  return String(form).split(/(\s+)/).map(token => {
    if (/^\s+$/.test(token) || neutral.has(token) || token === prefix || tense === 'perfect' && auxiliaries.has(token)) return esc(token);
    if (!/[a-zäöüß]/i.test(token)) return esc(token);
    let lead = '',
      core = token;
    if (prefix && core.startsWith(prefix) && core.length > prefix.length) {
      lead = esc(prefix);
      core = core.slice(prefix.length);
    }
    if (tense === 'perfect') {
      let front = '',
        end = '';
      if (core.startsWith('ge') && core.length > 4 && (!stem.startsWith('ge') || core.startsWith('ge' + stem[0]))) {
        front = '<span class="verb-change">ge</span>';
        core = core.slice(2);
      }
      if (core.endsWith('en') && core.length > 3) {
        end = '<span class="verb-change">en</span>';
        core = core.slice(0, -2);
      } else if (core.endsWith('t') && core.length > 2) {
        end = '<span class="verb-change">t</span>';
        core = core.slice(0, -1);
      }
      return lead + front + addedLetters(stem, core) + end;
    }
    return lead + addedLetters(stem, core);
  }).join('');
}
function verbGrammarHtml(word) {
  const entry = WORT_VERBS.lookup(word);
  if (!entry) return '<div class="empty">لم يُعثر على تصريف لهذا المدخل. جرّب البحث عن صيغة المصدر للفعل.</div>';
  const tenses = [['present', 'Präsens'], ['preterite', 'Präteritum'], ['perfect', 'Perfekt']];
  const pronouns = entry.pronouns || ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];
  const labels = [t("أنا"), t("أنت"), t("هو / هي"), t("نحن"), t("أنتم"), t("هم / حضرتك")];
  const forms = entry[verbTense] || [];
  return `<section class="verb-section"><div class="verb-base-heading"><h2>تصريف <b lang="${TARGET}" dir="${COURSE.dir(TARGET)}">${esc(entry.infinitive)}</b></h2>${word.german.toLocaleLowerCase() !== entry.infinitive.toLocaleLowerCase() ? `<p class="verb-note">الكلمة <b lang="${TARGET}">${esc(word.german)}</b> مرتبطة بالفعل الأصلي المعروض هنا.</p>` : ''}</div><div class="verb-tense-tabs" role="group" aria-label="زمن تصريف الفعل">${tenses.map(([key, label]) => `<button class="secondary" lang="de" dir="ltr" data-verb-tense="${key}" aria-pressed="${verbTense === key}">${label}</button>`).join('')}</div><p class="verb-legend">الأحرف المضافة أو المتغيّرة فقط ملوّنة. جذر الفعل والضمائر والأفعال المساعدة بلون عادي.</p><table class="verb-table" dir="ltr"><caption class="sr-only">${esc(tenses.find(t => t[0] === verbTense)[1])} · ${esc(entry.infinitive)}</caption><tbody>${forms.map((form, index) => `<tr><th scope="row" class="verb-pronoun"><span lang="${TARGET}">${esc(pronouns[index])}</span><span aria-hidden="true"> · </span><span lang="${NATIVE}" dir="${COURSE.dir(NATIVE)}">${labels[index]}</span></th><td class="verb-form" lang="${TARGET}" dir="${COURSE.dir(TARGET)}">${coloredVerbForm(entry, form, verbTense)}</td></tr>`).join('')}</tbody></table>${(entry.notes || []).map(note => `<p class="verb-note">${esc(note)}</p>`).join('')}</section>`;
}
function grammarHtml(word) {
  if (TARGET !== 'de') return WORT_GRAMMAR.render(word, {
    tense: verbTense
  });
  if (word.pos === 'verb') return verbGrammarHtml(word);
  let html = `<section class="grammar-section"><h2>تصريفات <b lang="${TARGET}">${esc(word.german)}</b></h2>${degreeHtml(word)}`;
  if (word.pos === 'noun') html += `<div class="example-card noun-summary-card">
  <p class="noun-article-line"><span class="noun-article-label">أداة الاسم</span>
  <b class="noun-article-value" lang="de" dir="ltr">${word.article ? articleHtml(word.article) : '—'}</b></p>
  ${word.plural ? `<p class="noun-plural-line"><span lang="de" dir="ltr">Plural</span><b lang="de" dir="ltr">${esc(word.plural)}</b></p>` : ''}
  </div>${nounCaseReference(word)}`;
  if (word.verbForms) html += `<p class="source-note">الصيغ مع ضمير المفرد الغائب (هو / هي)، ما لم يُذكر الضمير داخل الصيغة.</p><div class="grammar-grid">${Object.entries(word.verbForms).map(([key, value]) => `<div class="grammar-block"><h4>${{
    present: 'Präsens',
    past: 'Präteritum',
    perfect: 'Perfekt'
  }[key] || esc(key)}</h4><p lang="${TARGET}" dir="${COURSE.dir(TARGET)}">${esc(value)}</p></div>`).join('')}</div>`;
  html += '</section>';
  if (word.pos === 'adjective' && word.declensionStem) html += adjectiveTables(word);
  if (word.forms?.length) html += `<section class="grammar-section"><h3>صيغ الكلمة من المصدر</h3><div class="grammar-grid">${word.forms.slice(0, 80).map(form => `<div class="grammar-block"><strong lang="${TARGET}" dir="${COURSE.dir(TARGET)}">${esc(form.form || form.text)}</strong><small dir="ltr">${esc((form.tags || []).join(' · '))}</small></div>`).join('')}</div></section>`;
  if (word.pos !== 'noun' && !word.declensionStem && !word.forms?.length && !word.verbForms && !word.plural) html += '<p class="source-note">لا تتوفر تصريفات إضافية موثّقة في بيانات هذه الكلمة.</p>';
  return html;
}
function nextWord(options = {}) {
  const skip = Boolean(options.skip);
  if (!currentWord) return false;
  const list = cache.get(currentWord.level) || [];
  const index = list.findIndex(word => word.id === currentWord.id);
  if (index === -1 || !list.length) return false;
  // Do not cycle back to the very same word if it is the only unlearned one.
  for (let offset = 1; offset < list.length; offset++) {
    const word = list[(index + offset) % list.length];
    if (!learned.has(word.id)) {
      openWord(word);
      return true;
    }
  }
  if (skip) {
    toast(t("لا توجد كلمة أخرى لتخطيها في هذا المستوى."));
    return false;
  }
  $('#word-dialog').close();
  toast(t("أكملت كلمات المستوى. يمكنك مراجعتها في قسم المراجعة."));
  return false;
}
function skipWord() {
  // No learning event or progress update: just advance to an unseen word.
  if (wordAdvanceTimer !== null) cancelWordAdvance();
  nextWord({ skip: true });
}
function previousWord() {
  if (!currentWord) return;
  // Go back to the word the learner actually viewed, including if it was
  // just marked as learned and is now hidden from the ordinary vocabulary list.
  if (wordVisitHistory.length) {
    const word = wordVisitHistory.pop();
    openWord(word, false);
    return;
  }
  const list = cache.get(currentWord.level) || [];
  const index = list.findIndex(word => word.id === currentWord.id);
  if (index > 0) {
    openWord(list[index - 1], false);
  } else {
    toast(t("لا توجد كلمة سابقة."));
  }
}

function progressModel() {
  const history = WORT_HISTORY.snapshot();
  return {
    history,
    learnedIds: [...learned],
    savedIds: [...saved],
    total: totalWords(),
    levelCounts: Object.fromEntries(LEVELS.map(level => [level.code, manifest?.levels.find(item => item.code === level.code)?.count || 0])),
    unknownCount: history?.undatedIds.length || 0,
    loadLevel,
    speak
  };
}
function formatHours(ms) {
  return (Math.max(0, Number(ms) || 0) / 3600000).toLocaleString(LOCALE, {
    maximumFractionDigits: 2
  });
}
function updateUsageStats(snapshot) {
  if (!snapshot) return;
  $('#journey-hours').textContent = formatHours(snapshot.activeMs);
  $('#journey-active-days').textContent = snapshot.totalDays.toLocaleString(LOCALE);
  $('#usage-total').textContent = formatHours(snapshot.activeMs);
  $('#usage-days').textContent = snapshot.totalDays.toLocaleString(LOCALE);
  const current = WORT_HISTORY.dayKey();
  $('#usage-today').textContent = formatHours(snapshot.days.find(day => day.day === current)?.activeMs || 0);
  $('#usage-start').textContent = t("بدأ التسجيل: {v0}", {
    v0: snapshot.startedAt
  });
  $('#usage-live').textContent = snapshot.isIdle ? t("متوقف مؤقتًا لعدم التفاعل") : snapshot.isActive ? t("\u25CF يُحتسب وقتك الآن") : t("متوقف مؤقتًا");
  $('#usage-live').classList.toggle('is-active', snapshot.isActive && !snapshot.isIdle);
  if (snapshot.persistent === false) $('#usage-note').textContent = t("التخزين غير متاح في هذا المتصفح؛ الوقت الحالي محسوب لهذه الجلسة فقط. الوقت السابق لتفعيل الميزة لم يكن مسجّلًا.");
}
function updateReviewAvailability() {
  const current = countLearned(activeLevel),
    training = countLearned($('#training-level').value || activeLevel);
  $('#review-level').hidden = current === 0;
  $('#start-review').hidden = training === 0;
  $('#review-empty-note').hidden = training > 0;
  $('.training-options').dataset.reviewAvailable = String(training > 0);
  document.querySelectorAll('[data-review-learned]').forEach(button => button.hidden = current === 0);
  renderMistakeWords();
}
let mistakeRenderToken=0;
async function renderMistakeWords(){
 const code=$('#training-level').value||activeLevel;
 const pending=reviewMistakes.all().filter(id=>learned.has(id)&&idLevel(id)===code);
 const section=$('#review-mistakes-section'),count=$('#review-mistakes-count'),container=$('#review-mistakes-list');
 const token=++mistakeRenderToken;
 section.hidden=!pending.length;
 count.textContent=pending.length.toLocaleString(LOCALE);
 if(!pending.length){container.replaceChildren();return;}
 if(!cache.has(code))container.textContent=t("جارٍ تحميل الكلمات الصعبة…");
 try{
  const words=await loadLevel(code);
  if(token!==mistakeRenderToken||$('#training-level').value!==code)return;
  const ids=new Set(reviewMistakes.all().filter(id=>learned.has(id)&&idLevel(id)===code).map(String));
  const matches=words.filter(word=>ids.has(String(word.id)));
  section.hidden=!matches.length;
  count.textContent=matches.length.toLocaleString(LOCALE);
  container.innerHTML=uiHtml(matches.map(word=>'<div class="review-mistake-row">'+
   '<button type="button" class="review-mistake-word" data-open="'+esc(word.id)+'">'+
   '<span lang="'+TARGET+'" dir="'+COURSE.dir(TARGET)+'">'+(word.article?articleHtml(word.article)+' ':'')+esc(word.german)+'</span>'+
   '<small lang="'+NATIVE+'" dir="'+COURSE.dir(NATIVE)+'">'+esc(word.arabic)+'</small></button>'+
   '<button type="button" class="icon-button review-mistake-speak" data-speak="'+esc(word.id)+'" aria-label="'+esc(t("استمع إلى الكلمة"))+'">'+SPEAKER_ICON+'</button></div>').join(''));
 }catch{if(token===mistakeRenderToken)container.textContent=t("تعذّر تحميل الكلمات الصعبة.");}
}

function reviewLearned() {
  showPanel('training');
  $('#training-level').value = activeLevel;
  updateReviewAvailability();
}
function renderProgress() {
  if (!manifest) return;
  const model = progressModel();
  if (analyticsView) analyticsView.update(model);else analyticsView = WORT_ANALYTICS.mount($('#analytics-content'), model);
  if (calendarView) calendarView.update(model);else calendarView = WORT_CALENDAR.mount($('#calendar-content'), model);
  updateUsageStats(WORT_USAGE.snapshot());
  $('#progress-levels').innerHTML = uiHtml(LEVELS.map(level => {
    const count = manifest.levels.find(l => l.code === level.code)?.count || 0,
      done = Math.min(count, countLearned(level.code));
    return `<div class="overall-progress"><div class="progress-label"><strong>${level.code} · ${level.name}</strong><span dir="ltr">${done} / ${count}</span></div><div class="track"><i style="width:${count ? done / count * 100 : 0}%"></i></div></div>`;
  }).join(''));
  updateOwnedShield();
}
function shieldMarkup(index, name) {
  return `<span class="shield-sprite" role="img" aria-label="درع ${esc(name)}" style="background-position:${index % 5 * 25}% ${index < 5 ? 0 : 100}%"></span>`;
}
function ownedShields() {
  return (manifest?.shields || []).map((shield, index) => ({
    ...shield,
    index
  })).filter(shield => learned.size >= shield.threshold).sort((a, b) => a.threshold - b.threshold);
}
function updateOwnedShield() {
  const owned = ownedShields(),
    highest = owned.at(-1),
    button = $('#home-shield-button');
  $('#stats-shields').textContent = `${owned.length} / ${manifest?.shields?.length || 10}`;
  $('#home-shield-art').innerHTML = uiHtml(highest ? shieldMarkup(highest.index, highest.name) : '<svg class="shield-empty-symbol shield-starter" viewBox="0 0 48 48" width="40" height="40" role="img" aria-label="درع البداية"><path d="M24 3 40 9v13c0 11-6 17-16 23C14 39 8 33 8 22V9L24 3Z" fill="#d5f0ed" stroke="#21857e" stroke-width="2.5"/><path d="M24 16c-3-3-7-3-10-2v15c4-1 7 0 10 2 3-2 6-3 10-2V14c-4-1-7-1-10 2Z" fill="#fffaf1" stroke="#256778" stroke-width="1.5"/><path d="M24 16v15" stroke="#256778" stroke-width="1.5"/><path d="m24 7 1.3 2.6 2.8.4-2 2 .5 2.8-2.6-1.3-2.6 1.3.5-2.8-2-2 2.8-.4Z" fill="#e3a83f"/></svg>');
  const action = panel === 'badges' ? t("أغلق دروعك المكتسبة") : t("افتح دروعك المكتسبة");
  $('#home-shield-label').textContent = highest ? highest.name : t("دروعي");
  button.setAttribute('aria-label', highest ? t("درعك الحالي {v0}؛ {v1}", {
    v0: highest.name,
    v1: action
  }) : t("لم تكتسب درعًا بعد؛ {v0}", {
    v0: action
  }));
  button.title = action;
}
function renderBadges() {
  if (!manifest) return;
  // Use the actual curriculum shield thresholds and the current learner's progress.
  const shields = (manifest.shields || []).map((shield, index) => ({ ...shield, index }));
  const owned = ownedShields();
  const future = shields.filter(shield => learned.size < shield.threshold);
  const next = future[0];
  updateOwnedShield();

  $('#shields-caption').textContent = t("{v0} دروع مكتسبة", { v0: owned.length });
  $('#shield-note').textContent = t("هذه الدروع التي فتحتها بتعلّم كلمات جديدة. يظهر أعلى درع مكتسب بجانب اسم الموقع.");
  $('#shields').innerHTML = uiHtml(owned.length
    ? owned.map(shield => `<article class="shield-card unlocked"><div class="shield-art">${shieldMarkup(shield.index, shield.name)}</div><strong>${esc(shield.name)}</strong><small>${shield.threshold.toLocaleString(LOCALE)} كلمة</small><span class="shield-lock">✓ مكتسب</span></article>`).join('')
    : '<div class="empty"><h2>درعك الأول ينتظرك</h2><p>لم تكتسب درعًا بعد. كل كلمة جديدة تقرّبك منه.</p></div>');

  $('#badge-next').innerHTML = uiHtml(next
    ? `<article class="badge-next-card"><div class="badge-next-art">${shieldMarkup(next.index, next.name)}</div><div><p class="eyebrow">الدرع القادم</p><h2>${esc(next.name)}</h2><p>باقي ${Math.max(0, next.threshold - learned.size).toLocaleString(LOCALE)} كلمة جديدة</p><div class="track"><i style="width:${Math.min(100, learned.size / next.threshold * 100)}%"></i></div><small dir="ltr">${learned.size.toLocaleString(LOCALE)} / ${next.threshold.toLocaleString(LOCALE)}</small></div></article>`
    : '<div class="badge-complete">اكتملت الدروع العشرة! إنجاز جميل يستحق أن تواصل استخدام كلماتك في الجمل والكتابة.</div>');

  // The native details element retains its open/closed state across progress updates.
  const details = $('#future-shields-section');
  const row = $('#future-shields');
  const previousScroll = row.scrollLeft;
  details.hidden = future.length === 0;
  $('#future-shields-title').textContent = t("الدروع القادمة");
  $('#earned-shields-heading').textContent = t("دروعي المكتسبة");
  $('#future-shields-count').textContent = t("{v0} دروع متبقية", { v0: future.length.toLocaleString(LOCALE) });
  row.setAttribute('aria-label', t("الدروع القادمة"));
  row.innerHTML = uiHtml(future.map((shield, index) => {
    const left = Math.max(0, shield.threshold - learned.size).toLocaleString(LOCALE);
    const goal = shield.threshold.toLocaleString(LOCALE);
    return `<article role="listitem" class="future-shield-card${index === 0 ? ' is-next' : ''}">
      <div class="future-shield-art">${shieldMarkup(shield.index, shield.name)}</div>
      <strong>${esc(shield.name)}</strong>
      <small>${goal} ${esc(t("كلمة"))}</small>
      <span>${esc(t("باقي {v0} كلمة", { v0: left }))}</span>
    </article>`;
  }).join(''));
  row.scrollLeft = previousScroll;
}

function shuffled(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
let reviewRequest = 0;
async function startSession(type, code) {
  const request = ++reviewRequest,
    originPanel = panel;
  status('');
  try {
    const allWords = await loadLevel(code);
    if (request !== reviewRequest || panel !== originPanel || originPanel === 'training' && $('#training-level').value !== code || originPanel === 'library' && activeLevel !== code) return;
    const pool = allWords.filter(word => learned.has(word.id));
    if (type === 'mistakes' && !pool.some(word => reviewMistakes.has(word.id))) {
      toast(t("لا توجد كلمات صعبة لمراجعتها."));
      return;
    }
    if (!pool.length) {
      toast(t("تعلّم كلمة في هذا المستوى أولًا لتظهر في المراجعة."));
      return;
    }
    session = {
      type,
      code,
      pool,
      allWords,
      words: type === 'mistakes'
        ? shuffled(pool.filter(word => reviewMistakes.has(word.id))).slice(0, 10)
        : [...shuffled(pool.filter(word => reviewMistakes.has(word.id))), ...shuffled(pool.filter(word => !reviewMistakes.has(word.id)))].slice(0, 10),
      index: 0,
      score: 0,
      answered: false
    };
    renderSession();
    if (!$('#training-dialog').open) $('#training-dialog').showModal();
  } catch (error) {
    if (request !== reviewRequest) return;
    status(error.message);
    toast(error.message);
  }
}
function renderSession() {
  const s = session;
  if (!s) return;
  if (s.index === s.words.length) {
    $('#training-content').innerHTML = uiHtml(`<p class="eyebrow">مراجعة ${esc(s.code)}</p><h2 id="training-title">أكملت مراجعتك ✓</h2><div class="review-summary"><strong dir="ltr">${s.score} / ${s.words.length}</strong><p>إجابات صحيحة من الكلمات التي راجعتها</p></div><p class="review-summary-note">المراجعة تثبّت كلماتك المتعلّمة، ولا تضيف كلمات جديدة إلى تقدّمك.</p><div class="review-summary-actions"><button class="primary" id="session-again" type="button">مراجعة جديدة ↻</button><button class="secondary" id="session-finish" type="button">العودة للمراجعة</button></div>`);
    $('#session-again').onclick = () => {
      $('#training-dialog').close();
      startSession(s.type, s.code);
    };
    $('#session-finish').onclick = () => $('#training-dialog').close();
    return;
  }
  const word = s.words[s.index];
  s.answered = false;
  const distractors = shuffled([...new Map(s.allWords.filter(candidate => candidate.id !== word.id && candidate.arabic !== word.arabic).map(candidate => [candidate.arabic, candidate])).values()]).slice(0, 3);
  s.options = shuffled([word, ...distractors]);
  $('#training-content').innerHTML = uiHtml(`<p class="eyebrow review-session-meta">مراجعة ${esc(s.code)} · ${s.index + 1} من ${s.words.length}</p><h2 id="training-title">مراجعة كلماتك</h2><div class="track review-session-track" role="progressbar" aria-label="تقدّم جلسة المراجعة" aria-valuemin="0" aria-valuemax="${s.words.length}" aria-valuenow="${s.index}"><i style="width:${s.index / s.words.length * 100}%"></i></div><div class="review-word-heading" dir="ltr"><span class="review-word" lang="${TARGET}" dir="${COURSE.dir(TARGET)}">${word.article ? articleHtml(word.article) + ' ' : ''}${esc(word.german)}</span><button class="icon-button review-speak" id="session-speak" type="button" aria-label="استمع إلى ${esc((word.article ? word.article + ' ' : '') + word.german)}" title="استمع إلى الكلمة">${SPEAKER_ICON}</button></div><p class="review-question">ما معنى هذه الكلمة؟</p><div class="quiz-options" dir="${COURSE.dir(NATIVE)}" lang="${NATIVE}" role="group" aria-label="اختر معنى الكلمة">${s.options.map((candidate, index) => `<button type="button" data-answer="${index}">${esc(candidate.arabic)}</button>`).join('')}</div><p class="feedback" role="status" aria-live="polite"></p><button class="primary${s.index === s.words.length - 1 ? '' : ' word-navigation-button'}" id="session-next" type="button" hidden>${s.index === s.words.length - 1 ? t("نتيجة المراجعة") : t("الكلمة التالية")} ←</button>`);
  $('#session-speak').onclick = () => speak(`${word.article || ''} ${word.german}`, $('#session-speak'));
  $('#training-content').querySelectorAll('[data-answer]').forEach(button => button.onclick = () => {
    if (s.answered) return;
    s.answered = true;
    const correct = s.options[Number(button.dataset.answer)].id === word.id;
    $('#training-content').querySelectorAll('[data-answer]').forEach(option => {
      option.disabled = true;
      if (s.options[Number(option.dataset.answer)].id === word.id) option.classList.add('correct');
    });
    if (correct) s.score++;else button.classList.add('incorrect');
    if (reviewMistakes.record(word.id, correct)) renderMistakeWords();
    $('#training-content .feedback').textContent = correct ? t("\u2713 إجابة صحيحة") : t("المعنى الصحيح: ") + word.arabic;
    $('#session-next').hidden = false;
  });
  $('#session-next').onclick = () => {
    if (!s.answered) return;
    s.index++;
    renderSession();
  };
}
function renderSources() {
 const downloads=manifest.levels.map(level=>`<a href="${esc(level.data||'data/'+level.code+'.json')}" download="كلمة-${TARGET}-${level.code}.json">${esc(t('{level} · {count} مفردة',{level:level.code,count:level.count.toLocaleString(LOCALE)}))}</a>`).join('');
 const sources=(manifest.sources||[]).map(source=>`<div class="example-card"><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(t(source.names?.[NATIVE]||source.name))}</a><p class="source-note">${esc(t(source.license||''))}</p>${source.note||source.notes?`<p>${esc(t(source.notes?.[NATIVE]||source.note||''))}</p>`:''}</div>`).join('');
 $('#sources-content').innerHTML=uiHtml(`<p>${esc(manifest.levelNote)}</p>${sources}<h3>${esc(t('تنزيل بيانات المفردات'))}</h3><div class="data-downloads">${downloads}${TARGET==='de'?`<a href="data/verbs.json" download="كلمة-Verbs.json">${esc(t('جداول تصريف الأفعال'))}</a>`:''}</div><p class="source-note">${esc(t('النطق متاح باللغة التي تتعلّمها. التقدّم والمحفوظات محفوظة محليًا لكل لغة؛ وقت الاستخدام إجمالي للموقع.'))}</p>`);
}
document.querySelectorAll('[data-card-view]').forEach(button => button.onclick = () => setCardView(button.dataset.cardView));
setCardView(cardView);
$('#daily-goal-button').onclick = startDailyGoal;
$('#search').oninput = () => {
  $('#vocabulary-disclosure').open = true;
  pageSize = 24;
  renderCards();
};
$('#pos-filter').onchange = () => {
  $('#vocabulary-disclosure').open = true;
  pageSize = 24;
  renderCards();
};
$('#load-more').onclick = () => {
  pageSize += 24;
  renderCards();
};
$('#level-tabs').onclick = e => {
  const b = e.target.closest('[data-level]');
  if (b) selectLevel(b.dataset.level);
};
document.querySelectorAll('[data-panel]').forEach(b => b.onclick = () => showPanel(b.id === 'home-shield-button' && panel === 'badges' ? badgesReturnPanel : b.dataset.panel));
$('.brand').onclick = e => {
  e.preventDefault();
  showPanel('library');
};
$('#word-back').onclick = () => {
  cancelWordAdvance();
  $('#word-dialog').close();
};
$('#word-save').onclick = () => toggleSave(currentWord);
$('#mark-word').onclick = markCurrentWord;
$('#word-previous').onclick = previousWord;
$('#word-skip').onclick = skipWord;
document.querySelectorAll('[data-word-tab]').forEach(b => b.onclick = () => {
  wordTab = b.dataset.wordTab;
  renderWord();
});
$('.word-tabs').onkeydown = e => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const buttons = [...document.querySelectorAll('[data-word-tab]')],
    index = buttons.findIndex(b => b.dataset.wordTab === wordTab);
  const next = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (index + ((e.key === 'ArrowLeft') === (COURSE.dir(NATIVE) === 'rtl') ? 1 : -1) + buttons.length) % buttons.length;
  buttons[next].click();
  buttons[next].focus();
};
document.body.addEventListener('click', e => {
  if (e.target.closest('[data-retry-verbs]')) {
    renderWord();
    return;
  }
  if (e.target.closest('[data-review-learned]')) {
    reviewLearned();
    return;
  }
  const tenseButton = e.target.closest('[data-verb-tense]');
  if (tenseButton) {
    verbTense = tenseButton.dataset.verbTense;
    renderWord();
    document.querySelector(`[data-verb-tense="${verbTense}"]`)?.focus({
      preventScroll: true
    });
    return;
  }
  const open = e.target.closest('[data-open]'),
    save = e.target.closest('[data-save]'),
    audio = e.target.closest('[data-speak]'),
    example = e.target.closest('[data-example-speak]');
  if (open) {
    const word = findWord(open.dataset.open);
    if (word) openWord(word);
  }
  if (save) {
    const word = findWord(save.dataset.save);
    if (word) toggleSave(word);
  }
  if (audio) {
    const word = findWord(audio.dataset.speak);
    if (word) speak(`${word.article || ''} ${word.german}`, audio);
  }
  if (example) speak(example.dataset.exampleSpeak, example);
  if (e.target.closest('[data-pronounce]')) speak(`${currentWord.article || ''} ${currentWord.german}`, e.target.closest('[data-pronounce]'));
  if (e.target.closest('[data-detail-examples]')) {
    wordTab = 'examples';
    renderWord();
  }
});
$('#training-level').onchange = updateReviewAvailability;
$('#review-level').onclick = () => startSession('review', activeLevel);
$('#start-review').onclick = () => startSession('review', $('#training-level').value);
$('#start-mistakes-review').onclick = () => startSession('mistakes', $('#training-level').value);
$('#training-close').onclick = () => {
  $('#training-dialog').close();
  reviewRequest++;
};
$('#open-sources').onclick = () => {
  renderSources();
  $('#sources-dialog').showModal();
};
$('#sources-close').onclick = () => $('#sources-dialog').close();
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close', stopSpeech));
$('#word-dialog').addEventListener('close', cancelWordAdvance);
$('#word-dialog').addEventListener('cancel', cancelWordAdvance);
$('#word-summary').addEventListener('animationend', event => {
  if (event.target === event.currentTarget && ['word-card-enter', 'word-card-enter-reduced'].includes(event.animationName)) $('#word-dialog').classList.remove('word-turn-in');
});
document.addEventListener('wort:speak', event => {
  if (event.detail?.text) speak(event.detail.text, event.detail.button || null, event.detail.lang || TARGET);
});
WORT_USAGE.start();
WORT_USAGE.subscribe(updateUsageStats);
setInterval(() => {
  if (!document.hidden) {
    if (today.day !== WORT_HISTORY.dayKey()) updateProgress();
    if (panel === 'progress') updateUsageStats(WORT_USAGE.snapshot());
  }
}, 1000);
window.addEventListener('storage', event => {
  if (event.key === reviewMistakes.key) {
    reviewMistakes.reload();
    renderMistakeWords();
  }
  if (event.key === storageKey('wort-learned') || event.key === WORT_HISTORY.key) {
    for (const id of storedSet(storageKey('wort-learned'))) learned.add(id);
    WORT_HISTORY.sync([...learned]);
    renderCards();
    if (currentWord) updateWordControls();
    if (manifest) updateProgress();
  }
});
async function init() {
  try {
    manifest = await WORT_CONTENT.manifest();
    $('#level-note').textContent = manifest.levelNote || $('#level-note').textContent;
    $('#word-title').lang = TARGET;
    $('#word-title').dir = COURSE.dir(TARGET);
    buildLevels();
    await selectLevel('A1');
    updateProgress();
  } catch (error) {
    status(error.message);
    $('#cards').innerHTML = uiHtml('<div class="empty">تعذّر بدء الموقع. <button class="secondary" id="retry-app">أعد المحاولة</button></div>');
    $('#retry-app').onclick = init;
  }
}
// Bootstrap waits for both manifest and first vocabulary level before showing UI.
globalThis.WORT_APP_INIT = init();