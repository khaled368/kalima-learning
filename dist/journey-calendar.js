/* A local-date learning calendar. Undated legacy words never become invented days. */
(function (global) {
  'use strict';
  const instances = new WeakMap();
  let nextInstance = 0;
  const number = value => new Intl.NumberFormat('ar').format(value);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function dayKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
  function validDay(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year,month,day] = value.split('-').map(Number), date = new Date(year,month-1,day,12);
    return date.getFullYear()===year && date.getMonth()===month-1 && date.getDate()===day;
  }
  function dateFromDay(day) { const [year,month,date]=day.split('-').map(Number); return new Date(year,month-1,date,12); }
  function addDays(day,amount) { const date=dateFromDay(day); date.setDate(date.getDate()+amount); return dayKey(date); }
  function todayKey(now) {
    if (validDay(now)) return now;
    const date=now instanceof Date ? now : now ? new Date(now) : new Date();
    return dayKey(Number.isFinite(date.getTime()) ? date : new Date());
  }
  function fullDate(day) { return new Intl.DateTimeFormat('ar',{calendar:'gregory',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(dateFromDay(day)); }
  function shortDate(day) { return new Intl.DateTimeFormat('ar',{calendar:'gregory',day:'numeric',month:'short'}).format(dateFromDay(day)); }
  function calculate(model={}) {
    const history=model.history||{}, today=todayKey(model.now), start=addDays(today,-27);
    let startedAt=validDay(history.startedAt) ? history.startedAt : today;
    if (startedAt>today) startedAt=today;
    const learned=Array.isArray(model.learnedIds) ? new Set(model.learnedIds.map(String)) : null;
    const firstLearning=new Map();
    for (const event of Array.isArray(history.events) ? history.events : []) {
      if (!event || !['string','number'].includes(typeof event.id) || !validDay(event.day) || event.day>today) continue;
      const key=String(event.id);
      if (learned && !learned.has(key)) continue;
      const previous=firstLearning.get(key);
      if (!previous || event.day<previous) firstLearning.set(key,event.day);
    }
    const counts=new Map();
    for (const day of firstLearning.values()) counts.set(day,(counts.get(day)||0)+1);
    const days=Array.from({length:28},(_,index)=>{
      const day=addDays(start,index),count=counts.get(day)||0,known=day>=startedAt;
      return {day,count,known,partial:!known&&count>0,unknown:!known&&!count,intensity:count ? Math.min(4,Math.ceil(count/5)) : 0};
    });
    const unknownCount=Number.isFinite(model.unknownCount) ? Math.max(0,Math.floor(model.unknownCount)) : Array.isArray(history.undatedIds) ? new Set(history.undatedIds.map(String)).size : 0;
    return {today,start,startedAt,days,total:days.reduce((sum,day)=>sum+day.count,0),learningDays:days.filter(day=>day.count>0).length,unknownCount};
  }
  function dayDescription(item) {
    if (item.unknown) return 'لا توجد بيانات مؤرخة لهذا اليوم؛ لا يُعدّ صفرًا.';
    if (item.partial) return `${number(item.count)} كلمة جديدة مؤرخة. السجل لهذا اليوم غير مكتمل.`;
    return item.count ? `${number(item.count)} كلمة جديدة تعلّمتها في هذا اليوم.` : 'لم تُسجَّل كلمات جديدة في هذا اليوم.';
  }
  function mount(container,initialModel={}) {
    if (!container?.querySelector) throw new TypeError('The learning calendar requires a container.');
    instances.get(container)?.destroy();
    const uid=`wort-calendar-${++nextInstance}`;
    let model=initialModel,stats=null,selectedDay=null,destroyed=false;
    const find=selector=>container.querySelector(selector);
    function updateSelected() {
      const item=stats.days.find(day=>day.day===selectedDay)||stats.days.at(-1);
      selectedDay=item.day;
      container.querySelectorAll('[data-calendar-day]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.calendarDay===selectedDay)));
      find('[data-calendar-date]').textContent=fullDate(item.day);
      find('[data-calendar-count]').textContent=item.unknown?'—':number(item.count);
      find('[data-calendar-detail]').textContent=dayDescription(item);
    }
    function render() {
      if (destroyed) return;
      stats=calculate(model);
      if (!stats.days.some(day=>day.day===selectedDay)) selectedDay=stats.today;
      const weekdays=stats.days.slice(0,7).map(day=>`<span>${esc(new Intl.DateTimeFormat('ar',{weekday:'short'}).format(dateFromDay(day.day)))}</span>`).join('');
      const buttons=stats.days.map(item=>`<button type="button" class="journey-calendar-day${item.unknown?' is-unknown':''}${item.partial?' is-partial':''}${item.day===stats.today?' is-today':''}" data-calendar-day="${item.day}" data-intensity="${item.intensity}" aria-pressed="${item.day===selectedDay}" aria-label="${esc(fullDate(item.day)+'؛ '+dayDescription(item))}" title="${esc(fullDate(item.day)+' — '+dayDescription(item))}"><span>${number(dateFromDay(item.day).getDate())}</span>${item.count?'<i aria-hidden="true"></i>':''}</button>`).join('');
      container.innerHTML=`<section class="journey-calendar" aria-labelledby="${uid}-heading"><header class="journey-calendar-heading"><div><p class="eyebrow">خطواتك الصغيرة تصنع الفرق</p><h2 id="${uid}-heading">تقويم التعلّم</h2><p>آخر ٢٨ يومًا · ${esc(shortDate(stats.start))} — ${esc(shortDate(stats.today))}</p></div><div class="journey-calendar-summary"><strong>${number(stats.learningDays)}</strong><span>أيام فيها كلمات جديدة</span></div></header><div class="journey-calendar-weekdays" aria-hidden="true" dir="ltr">${weekdays}</div><div class="journey-calendar-grid" role="group" aria-label="اختر يومًا لعرض الكلمات الجديدة المؤرخة" dir="ltr">${buttons}</div><div class="journey-calendar-legend"><span><i class="is-unknown"></i>غير مسجّل</span><span>أقل<i data-intensity="0"></i><i data-intensity="1"></i><i data-intensity="2"></i><i data-intensity="3"></i><i data-intensity="4"></i>أكثر</span></div><div class="journey-calendar-selection" aria-live="polite" aria-atomic="true"><div><strong data-calendar-date></strong><p data-calendar-detail></p></div><span data-calendar-count></span></div><p class="journey-calendar-note">الألوان تعبّر عن الكلمات الجديدة المؤرخة، ولا تشمل تكرار المراجعة أو إجمالي وقت الاستخدام.${stats.unknownCount?` لديك ${number(stats.unknownCount)} كلمة قديمة بلا تاريخ محفوظ، وتبقى ضمن إجمالي تقدّمك.`:''}</p></section>`;
      updateSelected();
    }
    function onClick(event) {
      const button=event.target.closest('[data-calendar-day]');
      if (button && container.contains(button)) { selectedDay=button.dataset.calendarDay;updateSelected(); }
    }
    function onKeydown(event) {
      const button=event.target.closest('[data-calendar-day]');
      if (!button || !container.contains(button) || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const index=stats.days.findIndex(day=>day.day===button.dataset.calendarDay);
      const offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};
      const target=event.key==='Home'?0:event.key==='End'?27:Math.max(0,Math.min(27,index+offsets[event.key]));
      selectedDay=stats.days[target].day;updateSelected();find(`[data-calendar-day="${selectedDay}"]`)?.focus({preventScroll:true});
    }
    container.addEventListener('click',onClick);container.addEventListener('keydown',onKeydown);
    const api={update(nextModel={}) {model=nextModel;render();},destroy() {destroyed=true;container.removeEventListener('click',onClick);container.removeEventListener('keydown',onKeydown);instances.delete(container);}};
    instances.set(container,api);render();return api;
  }
  global.WORT_CALENDAR=Object.freeze({mount,calculate});
})(globalThis);
