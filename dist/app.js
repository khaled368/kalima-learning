'use strict';
const words = globalThis.WORT_VOCABULARY;
const levels = [
  { code: 'A1', name: 'مبتدئ', description: 'الخطوات الأولى ومفردات الحياة اليومية' },
  { code: 'A2', name: 'أساسي', description: 'مواقف يومية وعمل وسفر' },
  { code: 'B1', name: 'متوسط', description: 'التعبير عن التجارب والآراء' },
  { code: 'B2', name: 'فوق المتوسط', description: 'نقاشات أوسع ومفاهيم أكثر تفصيلًا' },
  { code: 'C1', name: 'متقدّم', description: 'لغة دقيقة للتحليل والأفكار المعقّدة' }
];
const $ = selector => document.querySelector(selector);
const byId = new Map(words.map(word => [word.id, word]));
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function restoreIds(key) {
  const value = readStorage(key, []);
  return new Set(Array.isArray(value) ? value.filter(id => byId.has(id)) : []);
}
const saved = restoreIds('wort-saved');
const learned = restoreIds('wort-learned');
const day = new Date().toLocaleDateString('en-CA');
const storedToday = readStorage('wort-today', {});
const today = { day, ids: storedToday?.day === day && Array.isArray(storedToday.ids) ? [...new Set(storedToday.ids.filter(id => byId.has(id)))] : [] };
let activeLevel = 'A1';
let category = 'الكل';
let view = 'all';
const openLevels = new Set(['A1']);
const modal = $('#modal');

function levelWords(code) { return words.filter(word => word.level === code); }
function persist() {
  try {
    localStorage.setItem('wort-saved', JSON.stringify([...saved]));
    localStorage.setItem('wort-learned', JSON.stringify([...learned]));
    localStorage.setItem('wort-today', JSON.stringify(today));
  } catch { /* Learning remains available when browser storage is unavailable. */ }
  updateProgress();
}
function markLearned(id) {
  learned.add(id);
  if (!today.ids.includes(id)) today.ids.push(id);
  persist();
  renderSections();
}
function updateProgress() {
  $('#learned').textContent = learned.size;
  $('#saved-count').textContent = saved.size;
  const count = Math.min(5, today.ids.length);
  $('#percent').textContent = `${count * 20}%`;
  $('#bar').style.width = `${count * 20}%`;
  $('#goal').textContent = `${count} من 5 كلمات`;
  for (const level of levels) {
    const list = levelWords(level.code);
    const done = list.filter(word => learned.has(word.id)).length;
    const tile = $(`[data-level-jump="${level.code}"]`);
    if (tile) {
      tile.querySelector('small').textContent = `${done} / ${list.length} كلمة تعلّمتها`;
      tile.querySelector('.progress i').style.width = `${done / list.length * 100}%`;
    }
  }
}
function setActiveLevel(code) {
  activeLevel = code;
  const level = levels.find(level => level.code === code);
  $('#current-level').textContent = `المستوى ${code} · ${level.name}`;
  document.querySelectorAll('[data-level-jump]').forEach(button => {
    const selected = button.dataset.levelJump === code;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
function renderTiles() {
  $('#level-tiles').innerHTML = levels.map(level => `<button class="level-tile" data-level-jump="${level.code}" aria-pressed="false" aria-controls="section-${level.code}" aria-label="افتح قسم ${level.code} — ${level.name}"><span class="level-code" dir="ltr">${level.code}</span><b>${level.name}</b><small></small><div class="progress" aria-hidden="true"><i></i></div></button>`).join('');
  setActiveLevel(activeLevel);
  updateProgress();
}
function renderCard(word) {
  return `<article class="card" data-word-id="${word.id}"><button class="bookmark ${saved.has(word.id) ? 'saved' : ''}" aria-label="${saved.has(word.id) ? 'إزالة' : 'حفظ'} ${escapeHtml(word.german)} ${saved.has(word.id) ? 'من المحفوظات' : 'في المحفوظات'}" aria-pressed="${saved.has(word.id)}" data-save="${word.id}">${saved.has(word.id) ? '★' : '☆'}</button>${learned.has(word.id) ? '<span class="learned-mark">✓ تعلّمتها</span>' : ''}<div class="emoji" aria-hidden="true">${word.emoji}</div><div class="german" lang="de" dir="ltr">${word.article ? `<span class="article">${word.article}</span> ` : ''}${escapeHtml(word.german)}</div><div class="meaning">${escapeHtml(word.arabic)}</div><div class="card-bottom"><span class="tag">${word.level}</span><button class="speak" data-speak="${word.id}" aria-label="استمع إلى ${escapeHtml(word.german)}">استمع ♬</button></div></article>`;
}
function filteredWords() {
  const query = $('#search').value.trim().toLocaleLowerCase();
  return words.filter(word => (view !== 'saved' || saved.has(word.id)) && (category === 'الكل' || word.category === category) && (!query || `${word.article} ${word.german} ${word.arabic} ${word.level}`.toLocaleLowerCase().includes(query)));
}
function renderSections() {
  const list = filteredWords();
  const filtering = view === 'saved' || category !== 'الكل' || Boolean($('#search').value.trim());
  $('#count').textContent = `${list.length} كلمة · ${new Set(list.map(word => word.level)).size} مستويات`;
  $('#section-title').textContent = view === 'saved' ? 'كلماتي المحفوظة حسب المستوى' : 'أقسام المفردات';
  const html = levels.map(level => {
    const matches = list.filter(word => word.level === level.code);
    if (filtering && !matches.length) return '';
    const done = levelWords(level.code).filter(word => learned.has(word.id)).length;
    return `<details class="level-section" id="section-${level.code}" data-section="${level.code}" ${filtering || openLevels.has(level.code) ? 'open' : ''}><summary><span class="section-badge">${level.code}</span><div class="level-heading"><h3>${level.name}</h3><p>${level.description}</p></div><div class="section-meta"><span>${matches.length} بطاقة</span><span>${done} كلمة تعلّمتها</span></div><span class="chevron" aria-hidden="true">⌄</span></summary><div class="level-body"><div class="level-actions"><button class="primary" data-review="${level.code}">مراجعة بطاقات ${level.code} ↻</button><button class="secondary" data-quiz="${level.code}">اختبار ${level.code} ◈</button></div><div class="cards">${matches.map(renderCard).join('')}</div></div></details>`;
  }).join('');
  $('#level-sections').innerHTML = html || `<div class="empty">${view === 'saved' && !saved.size ? 'لم تحفظ كلمات بعد. اضغط على النجمة في أي بطاقة لإضافتها هنا.' : 'لا توجد كلمات تطابق البحث أو الموضوع. جرّب كلمة أخرى.'}</div>`;
  document.querySelectorAll('[data-section]').forEach(section => {
    section.addEventListener('toggle', () => {
      if (filtering) return;
      if (section.open) openLevels.add(section.dataset.section);
      else openLevels.delete(section.dataset.section);
    });
    section.querySelector('summary').addEventListener('click', () => setActiveLevel(section.dataset.section));
  });
}
function setView(nextView, activeButton = document.querySelector(`[data-view="${nextView}"]`)) {
  view = nextView;
  document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button === activeButton));
  renderSections();
}
function goToLevel(code) {
  category = 'الكل';
  $('#category-filter').value = category;
  $('#search').value = '';
  openLevels.add(code);
  setActiveLevel(code);
  setView('all');
  $(`#section-${code}`).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
}
function speak(id) {
  if (!('speechSynthesis' in window)) {
    alert('النطق غير متاح في هذا المتصفح. جرّب متصفحًا يدعم النطق.');
    return;
  }
  const word = byId.get(id);
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(`${word.article} ${word.german}`.trim());
  utterance.lang = 'de-DE';
  utterance.rate = .8;
  const voice = speechSynthesis.getVoices().find(voice => voice.lang.startsWith('de'));
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}
function openModal() { if (!modal.open) modal.showModal(); }
function closeModal() { modal.close(); if ('speechSynthesis' in window) speechSynthesis.cancel(); }
$('.close').onclick = closeModal;
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
modal.addEventListener('close', () => { if ('speechSynthesis' in window) speechSynthesis.cancel(); });
let reviewList = [];
let reviewIndex = 0;
let sessionLevel = 'A1';
function startReview(code = activeLevel) {
  sessionLevel = code;
  reviewIndex = 0;
  reviewList = levelWords(code);
  setActiveLevel(code);
  renderReview();
  openModal();
}
function renderReview() {
  if (reviewIndex === reviewList.length) {
    $('#modal-body').innerHTML = `<div class="session-summary"><div class="emoji">🌿</div><h2 id="modal-title" class="modal-title">أكملت بطاقات ${sessionLevel}</h2><p>راجعت ${reviewList.length} كلمة. أحسنت، خطوة جديدة إلى الأمام!</p><button class="primary" id="review-again">راجعها مرة أخرى</button></div>`;
    $('#review-again').onclick = () => startReview(sessionLevel);
    return;
  }
  const word = reviewList[reviewIndex];
  $('#modal-body').innerHTML = `<p class="modal-caption">المستوى ${sessionLevel} · بطاقة ${reviewIndex + 1} من ${reviewList.length}</p><h2 id="modal-title" class="modal-title">بطاقات المراجعة</h2><div class="emoji" aria-hidden="true">${word.emoji}</div><div class="quiz-word" lang="de" dir="ltr">${escapeHtml(`${word.article} ${word.german}`.trim())}</div><button class="secondary" id="reveal">أظهر المعنى</button><div id="translation" class="review-progress" aria-live="polite" style="margin:20px;min-height:28px"></div><div class="review-actions"><button class="secondary" id="listen">استمع ♬</button><button class="primary" id="next" disabled>تعلّمتها ←</button></div>`;
  $('#reveal').onclick = () => {
    $('#translation').textContent = word.arabic;
    $('#reveal').hidden = true;
    $('#next').disabled = false;
  };
  $('#listen').onclick = () => speak(word.id);
  $('#next').onclick = () => { markLearned(word.id); reviewIndex++; renderReview(); };
}
function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
let questionIndex = 0;
let score = 0;
let quizList = [];
let quizPool = [];
function startQuiz(code = activeLevel) {
  sessionLevel = code;
  questionIndex = 0;
  score = 0;
  quizPool = levelWords(code);
  quizList = shuffled(quizPool).slice(0, 5);
  setActiveLevel(code);
  renderQuiz();
  openModal();
}
function renderQuiz() {
  if (questionIndex === quizList.length) {
    $('#modal-body').innerHTML = `<div class="session-summary"><div class="emoji">${score >= 4 ? '🎉' : '🌱'}</div><h2 id="modal-title" class="modal-title">أكملت اختبار ${sessionLevel}</h2><p>نتيجتك ${score} من ${quizList.length}</p><p>كل محاولة تساعدك على التذكّر.</p><button class="primary" id="retry">اختبار جديد من ${sessionLevel}</button></div>`;
    $('#retry').onclick = () => startQuiz(sessionLevel);
    return;
  }
  const word = quizList[questionIndex];
  const options = shuffled([word, ...shuffled(quizPool.filter(candidate => candidate.id !== word.id && candidate.arabic !== word.arabic)).slice(0, 3)]);
  $('#modal-body').innerHTML = `<p class="modal-caption">المستوى ${sessionLevel} · السؤال ${questionIndex + 1} من ${quizList.length}</p><h2 id="modal-title" class="modal-title">ما معنى هذه الكلمة؟</h2><div class="quiz-word" lang="de" dir="ltr">${escapeHtml(`${word.article} ${word.german}`.trim())}</div><div class="options">${options.map(option => `<button data-answer="${option.id}">${escapeHtml(option.arabic)}</button>`).join('')}</div><div class="feedback" aria-live="polite"></div><button class="primary" id="qnext" hidden>التالي ←</button>`;
  let answered = false;
  document.querySelectorAll('[data-answer]').forEach(button => {
    button.onclick = () => {
      if (answered) return;
      answered = true;
      document.querySelectorAll('[data-answer]').forEach(option => {
        option.disabled = true;
        if (+option.dataset.answer === word.id) option.style.background = '#dcebcf';
      });
      if (+button.dataset.answer === word.id) {
        score++;
        markLearned(word.id);
        $('.feedback').textContent = 'إجابة صحيحة! رائع ✨';
      } else {
        button.style.background = '#f6ded5';
        $('.feedback').textContent = `المعنى الصحيح: ${word.arabic}`;
      }
      $('#qnext').hidden = false;
    };
  });
  $('#qnext').onclick = () => { questionIndex++; renderQuiz(); };
}

const categories = ['الكل', ...new Set(words.map(word => word.category))];
$('#category-filter').innerHTML = categories.map(value => `<option value="${escapeHtml(value)}">${value === 'الكل' ? 'جميع المواضيع' : escapeHtml(value)}</option>`).join('');
$('#category-filter').onchange = event => { category = event.target.value; renderSections(); };
$('#search').oninput = renderSections;
$('#level-tiles').onclick = event => {
  const button = event.target.closest('[data-level-jump]');
  if (button) goToLevel(button.dataset.levelJump);
};
$('#level-sections').onclick = event => {
  const save = event.target.closest('[data-save]');
  const listen = event.target.closest('[data-speak]');
  const review = event.target.closest('[data-review]');
  const quiz = event.target.closest('[data-quiz]');
  if (save) {
    const id = +save.dataset.save;
    const wasSaved = saved.has(id);
    if (wasSaved) saved.delete(id); else saved.add(id);
    persist();
    if (view === 'saved') {
      renderSections();
      const next = $('#level-sections [data-save]');
      if (next) next.focus({ preventScroll: true });
      else $('#search').focus({ preventScroll: true });
    } else {
      save.classList.toggle('saved', !wasSaved);
      save.setAttribute('aria-pressed', String(!wasSaved));
      save.setAttribute('aria-label', `${!wasSaved ? 'إزالة' : 'حفظ'} ${byId.get(id).german} ${!wasSaved ? 'من المحفوظات' : 'في المحفوظات'}`);
      save.textContent = !wasSaved ? '★' : '☆';
    }
  }
  if (listen) speak(+listen.dataset.speak);
  if (review) startReview(review.dataset.review);
  if (quiz) startQuiz(quiz.dataset.quiz);
};
$('#start').onclick = () => startReview();
document.querySelectorAll('[data-view]').forEach(button => {
  button.onclick = () => {
    if (button.dataset.view === 'review') return startReview();
    if (button.dataset.view === 'quiz') return startQuiz();
    setView(button.dataset.view, button);
    $('#levels-title').scrollIntoView({ block: 'start' });
  };
});
$('#date').textContent = new Date().toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' });
renderTiles();
renderSections();
