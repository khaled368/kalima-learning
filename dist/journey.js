/* A real learning path: real topical groups and 60-word steps preserve every vocabulary ID. */
(function (global) {
  'use strict';
  const UNIT_SIZE = 60;
  const DAILY_GOAL = 20;
  const instances = new WeakMap();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = value => new Intl.NumberFormat('ar',{maximumFractionDigits:0}).format(value);
  const ids = value => new Set((value instanceof Set ? [...value] : Array.isArray(value) ? value : []).filter(id => typeof id === 'number' || typeof id === 'string').map(String));
  function calculate(model = {}) {
    const words = Array.isArray(model.words) ? model.words : [];
    const learned = ids(model.learnedIds);
    const units=[],used=new Set(),wordById=new Map(words.map(word=>[String(word.id),word]));
    function addUnit(slice,topic={}){
      if(!slice.length)return;
      const done=slice.reduce((count,word)=>count+(learned.has(String(word.id))?1:0),0);
      units.push({index:units.length,start:units.reduce((n,u)=>n+u.total,0)+1,end:units.reduce((n,u)=>n+u.total,0)+slice.length,total:slice.length,learned:done,remaining:slice.length-done,percent:done/slice.length*100,firstUnlearnedId:slice.find(word=>!learned.has(String(word.id)))?.id??null,wordIds:slice.map(word=>word.id),title:topic.title||'الخطوة '+number(units.length+1),icon:topic.icon||''});
    }
    for(const topic of global.WORT_JOURNEY_TOPICS?.[model.level]||[]){
      const slice=[];for(const id of topic.ids){const key=String(id);if(!used.has(key)&&wordById.has(key)){slice.push(wordById.get(key));used.add(key);}}
      addUnit(slice,topic);
    }
    const remaining=words.filter(word=>!used.has(String(word.id)));
    for(let start=0;start<remaining.length;start+=UNIT_SIZE)addUnit(remaining.slice(start,start+UNIT_SIZE));
    const firstIncomplete = units.find(unit => unit.remaining > 0);
    const currentIndex = firstIncomplete ? firstIncomplete.index : Math.max(0, units.length - 1);
    const selectedIndex = Number.isInteger(model.selectedUnit) && model.selectedUnit >= 0 && model.selectedUnit < units.length ? model.selectedUnit : null;
    const focusIndex = selectedIndex ?? currentIndex;
    const focused = units[focusIndex] || null;
    const todayCount = Number.isFinite(Number(model.todayCount)) ? Math.max(0, Math.floor(Number(model.todayCount))) : 0;
    return { level: String(model.level || 'A1'), units, currentIndex, selectedIndex, focusIndex, focused,
      learned: units.reduce((sum, unit) => sum + unit.learned, 0), completed: units.filter(unit => unit.remaining === 0).length,
      total: words.length, todayCount, dailyGoal: DAILY_GOAL, dailyPercent: Math.min(100, todayCount / DAILY_GOAL * 100),
      allComplete: units.length > 0 && units.every(unit => unit.remaining === 0) };
  }
  function ring(unit) {
    const radius = 14, circumference = 2 * Math.PI * radius;
    return `<svg class="journey-unit-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="${radius}"/><circle class="journey-unit-ring-value" cx="18" cy="18" r="${radius}" stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${(circumference * (1-unit.percent/100)).toFixed(2)}"/></svg>`;
  }
  function mount(container, initialModel = {}) {
    if (!container) throw new Error('Learning path requires a container.');
    instances.get(container)?.destroy();
    let model = { ...initialModel }, expanded = false, destroyed = false;
    let localSelection = Object.prototype.hasOwnProperty.call(model, 'selectedUnit') ? model.selectedUnit : null;
    let lastLevel = model.level;
    function state() { return calculate({ ...model, selectedUnit: Object.prototype.hasOwnProperty.call(model, 'selectedUnit') ? model.selectedUnit : localSelection }); }
    function render(focusKey) {
      if (destroyed) return;
      const stats = state();
      container.dataset.selected=String(stats.selectedIndex!==null);
      container.classList.add('journey');
      if (!stats.units.length) {
        container.innerHTML = '<p class="journey-loading" role="status">جارٍ إعداد مسار المستوى…</p>';
        return;
      }
      const from = Math.max(0, Math.min(stats.focusIndex - 1, stats.units.length - 3));
      const visibleUnits = expanded ? stats.units : stats.units.slice(from, from + 3);
      const current = stats.focused;
      const continueId = current?.firstUnlearnedId;
      const selectedNote = stats.selectedIndex === null ? 'تعرض قائمة المفردات جميع كلمات المستوى غير المتعلّمة.' : `تعرض قائمة المفردات الكلمات غير المتعلّمة من الخطوة ${number(stats.selectedIndex+1)}.`;
      const unitHtml = unit => {
        const completed = unit.remaining === 0, currentStep = !stats.allComplete && unit.index === stats.currentIndex;
        const selected = stats.selectedIndex === unit.index;
        const label = `الخطوة ${number(unit.index+1)}، الكلمات ${number(unit.start)} إلى ${number(unit.end)}، تعلّمت ${number(unit.learned)} من ${number(unit.total)}`;
        return `<li class="journey-step ${completed?'is-complete':''} ${currentStep?'is-current':''} ${selected?'is-selected':''}"><span class="journey-step-marker" aria-hidden="true">${completed?'✓':number(unit.index+1)}</span><button type="button" class="journey-unit" data-journey-unit="${unit.index}" data-journey-focus="unit-${unit.index}" aria-pressed="${selected}" ${currentStep?'aria-current="step"':''} aria-label="${esc(label)}"><span class="journey-unit-copy"><span class="journey-unit-heading"><strong>${esc(unit.title)}</strong><span class="journey-unit-status">${completed?'مكتملة':currentStep?'خطوتك التالية':'متاحة'}</span></span><span class="journey-unit-detail">${number(unit.total)} كلمة<span class="journey-unit-learned"> · <b dir="ltr">${number(unit.learned)} / ${number(unit.total)}</b> تعلّمتها</span></span></span><span class="journey-unit-progress">${unit.icon?`<span class="journey-topic-icon" aria-hidden="true">${unit.icon}</span>`:ring(unit)}<span class="journey-ring-label ${unit.icon?'has-topic-icon':''}">${completed?'✓':number(Math.round(unit.percent))+'٪'}</span></span></button></li>`;
      };
      container.innerHTML = `<div class="journey-heading"><div><p class="journey-eyebrow">خطوات صغيرة، معرفة أكبر</p><h2>مسارك في <span lang="de" dir="ltr">${esc(stats.level)}</span></h2></div><span class="journey-completed-count" dir="ltr">${number(stats.completed)} / ${number(stats.units.length)}<small dir="rtl">خطوة مكتملة</small></span></div><ol class="journey-steps ${expanded?'is-expanded':''}" aria-label="خطوات المستوى">${visibleUnits.map(unitHtml).join('')}</ol><div class="journey-controls"><button type="button" class="journey-text-button" data-journey-action="expand" data-journey-focus="expand" aria-expanded="${expanded}">${expanded?'اختصر المسار':'كل خطوات المستوى ('+number(stats.units.length)+')'} <span aria-hidden="true">${expanded?'−':'+'}</span></button><button type="button" class="journey-text-button" data-journey-action="all" data-journey-focus="all" aria-pressed="${stats.selectedIndex===null}">كل المفردات <span aria-hidden="true">←</span></button></div><p class="journey-selection-note" aria-live="polite">${selectedNote}</p><div class="journey-footer"><div class="journey-daily"><div class="journey-daily-heading"><span>${stats.todayCount>=DAILY_GOAL?'اكتمل هدف اليوم':'هدفك اليومي'}</span><strong dir="ltr">${number(stats.todayCount)} / ${number(DAILY_GOAL)}</strong></div><div class="journey-daily-track" role="progressbar" aria-label="الهدف اليومي: عشرون كلمة جديدة" aria-valuemin="0" aria-valuemax="${DAILY_GOAL}" aria-valuenow="${Math.min(DAILY_GOAL,stats.todayCount)}"><i style="width:${stats.dailyPercent}%"></i></div><small>${stats.todayCount>=DAILY_GOAL?'كل كلمة إضافية إنجاز جديد.':'تعلّم '+number(Math.max(0,DAILY_GOAL-stats.todayCount))+' كلمة جديدة لإكمال الهدف.'}</small></div><button type="button" class="journey-continue" data-journey-action="continue" data-journey-focus="continue" data-selected="${stats.selectedIndex!==null}" ${continueId===null||continueId===undefined?'disabled':''}>${stats.allComplete?'أكملت المستوى ✓':continueId===null||continueId===undefined?'أكملت هذه الخطوة ✓':current.learned>0?'تابع الخطوة '+number(current.index+1):'ابدأ الخطوة '+number(current.index+1)}<span aria-hidden="true">←</span></button></div>`;
      if (focusKey) container.querySelector(`[data-journey-focus="${focusKey}"]`)?.focus({preventScroll:true});
    }
    function selectUnit(index, focusKey) {
      localSelection = index;
      if (Object.prototype.hasOwnProperty.call(model, 'selectedUnit')) model.selectedUnit = index;
      render(focusKey);
      if (typeof model.onUnitChange === 'function') model.onUnitChange(index);
    }
    function click(event) {
      const button = event.target.closest('button');
      if (!button || !container.contains(button) || button.disabled) return;
      if (button.hasAttribute('data-journey-unit')) { selectUnit(Number(button.dataset.journeyUnit),button.dataset.journeyFocus); return; }
      const action = button.dataset.journeyAction;
      if (action === 'expand') { expanded = !expanded; render('expand'); }
      else if (action === 'all') selectUnit(null,'all');
      else if (action === 'continue') {
        const nextId = state().focused?.firstUnlearnedId;
        if (nextId !== null && nextId !== undefined && typeof model.onContinue === 'function') model.onContinue(nextId);
      }
    }
    function update(nextModel = {}) {
      if (destroyed) return;
      const active = container.contains(container.ownerDocument.activeElement) ? container.ownerDocument.activeElement.dataset?.journeyFocus : null;
      model = { ...model, ...nextModel };
      if (model.level !== lastLevel) { expanded = false; localSelection = null; if (!Object.prototype.hasOwnProperty.call(nextModel,'selectedUnit')) model.selectedUnit = null; lastLevel = model.level; }
      render(active);
    }
    function destroy() { if (destroyed) return; destroyed = true; container.removeEventListener('click',click); container.classList.remove('journey'); container.innerHTML = ''; instances.delete(container); }
    const api = { update, destroy };
    container.addEventListener('click',click); instances.set(container,api); render(); return api;
  }
  global.WORT_JOURNEY = { mount, calculate, unitSize: UNIT_SIZE, dailyGoal: DAILY_GOAL };
  if (typeof module === 'object' && module.exports) module.exports = { calculate, unitSize: UNIT_SIZE, dailyGoal: DAILY_GOAL };
})(typeof window === 'object' ? window : globalThis);
