/* A local-date learning calendar. Undated legacy words never become invented days. */
(function (global) {
  'use strict';

  const languageCourse=globalThis.WORT_COURSE||{};
  const nativeLanguage=languageCourse.native||'ar', locale=languageCourse.locale||nativeLanguage;
  const targetLanguage=languageCourse.target||'de';
  const languageDirection=code=>languageCourse.dir?.(code)||(code==='ar'?'rtl':'ltr');
  const translationRows=[["لا توجد بيانات مؤرخة لهذا اليوم؛ لا يُعدّ صفرًا.","There is no dated data for this day; it does not count as zero.","Voor deze dag zijn geen gegevens met datum beschikbaar; dit telt niet als nul.","Für diesen Tag liegen keine datierten Daten vor; er zählt nicht als null."],["{count} كلمة جديدة مؤرخة. السجل لهذا اليوم غير مكتمل.","{count} newly learned words with dates. This day's history is incomplete.","{count} nieuw geleerde woorden met datum. De geschiedenis voor deze dag is onvolledig.","{count} neue Wörter mit Datum. Der Verlauf dieses Tages ist unvollständig."],["{count} كلمة جديدة تعلّمتها في هذا اليوم.","{count} new words learned on this day.","{count} nieuwe woorden geleerd op deze dag.","{count} neue Wörter an diesem Tag gelernt."],["لم تُسجَّل كلمات جديدة في هذا اليوم.","No new words recorded on this day.","Op deze dag zijn geen nieuwe woorden vastgelegd.","An diesem Tag wurden keine neuen Wörter erfasst."],["خطواتك الصغيرة تصنع الفرق","Small steps make a difference","Kleine stappen maken het verschil","Kleine Schritte machen den Unterschied"],["تقويم التعلّم","Learning calendar","Leerkalender","Lernkalender"],["آخر ٢٨ يومًا","Last 28 days","Afgelopen 28 dagen","Letzte 28 Tage"],["أيام فيها كلمات جديدة","days with new words","dagen met nieuwe woorden","Tage mit neuen Wörtern"],["اختر يومًا لعرض الكلمات الجديدة المؤرخة","Choose a day to see newly learned words with dates","Kies een dag om nieuwe woorden met datum te zien","Tag auswählen, um neue Wörter mit Datum zu sehen"],["غير مسجّل","Not recorded","Niet vastgelegd","Nicht erfasst"],["أقل","Less","Minder","Weniger"],["أكثر","More","Meer","Mehr"],["الألوان تعبّر عن الكلمات الجديدة المؤرخة، ولا تشمل تكرار المراجعة أو إجمالي وقت الاستخدام.","Colors show newly learned words with dates, excluding repeated review and total time spent.","De kleuren tonen nieuw geleerde woorden met datum, zonder herhalingen of de totale gebruikstijd.","Die Farben zeigen neue Wörter mit Datum, ohne Wiederholungen oder die gesamte Nutzungszeit."],["لديك {count} كلمة قديمة بلا تاريخ محفوظ، وتبقى ضمن إجمالي تقدّمك.","You have {count} older words without a saved date; they still count toward your total progress.","Je hebt {count} oudere woorden zonder opgeslagen datum; ze blijven meetellen voor je totale voortgang.","Du hast {count} frühere Wörter ohne gespeichertes Datum; sie zählen weiterhin zum Gesamtfortschritt."]];
  const translationCatalog={en:{},nl:{},de:{}};
  for(const [source,en,nl,de] of translationRows){translationCatalog.en[source]=en;translationCatalog.nl[source]=nl;translationCatalog.de[source]=de;}
  globalThis.WORT_I18N?.add(translationCatalog);
  function tr(source,params={}){
    if(globalThis.WORT_I18N?.t)return globalThis.WORT_I18N.t(source,params);
    const value=nativeLanguage==='ar'?source:(translationCatalog[nativeLanguage]?.[source]||source);
    return value.replace(/\{(\w+)\}/g,(match,key)=>Object.prototype.hasOwnProperty.call(params,key)?String(params[key]):match);
  }
  const instances = new WeakMap();
  let nextInstance = 0;
  const number = value => new Intl.NumberFormat(locale).format(value);
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
  function fullDate(day) { return new Intl.DateTimeFormat(locale,{calendar:'gregory',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(dateFromDay(day)); }
  function shortDate(day) { return new Intl.DateTimeFormat(locale,{calendar:'gregory',day:'numeric',month:'short'}).format(dateFromDay(day)); }
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
    if(item.unknown)return tr('لا توجد بيانات مؤرخة لهذا اليوم؛ لا يُعدّ صفرًا.');
    if(item.partial)return tr('{count} كلمة جديدة مؤرخة. السجل لهذا اليوم غير مكتمل.',{count:number(item.count)});
    return item.count?tr('{count} كلمة جديدة تعلّمتها في هذا اليوم.',{count:number(item.count)}):tr('لم تُسجَّل كلمات جديدة في هذا اليوم.');
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
      const weekdays=stats.days.slice(0,7).map(day=>`<span>${esc(new Intl.DateTimeFormat(locale,{weekday:'short'}).format(dateFromDay(day.day)))}</span>`).join('');
      const buttons=stats.days.map(item=>`<button type="button" class="journey-calendar-day${item.unknown?' is-unknown':''}${item.partial?' is-partial':''}${item.day===stats.today?' is-today':''}" data-calendar-day="${item.day}" data-intensity="${item.intensity}" aria-pressed="${item.day===selectedDay}" aria-label="${esc(fullDate(item.day)+(nativeLanguage==='ar'?'؛ ':'; ')+dayDescription(item))}" title="${esc(fullDate(item.day)+' — '+dayDescription(item))}"><span>${number(dateFromDay(item.day).getDate())}</span>${item.count?'<i aria-hidden="true"></i>':''}</button>`).join('');
      container.innerHTML=`<section class="journey-calendar" aria-labelledby="${uid}-heading"><header class="journey-calendar-heading"><div><p class="eyebrow">${esc(tr('خطواتك الصغيرة تصنع الفرق'))}</p><h2 id="${uid}-heading">${esc(tr('تقويم التعلّم'))}</h2><p>${esc(tr('آخر ٢٨ يومًا'))} · ${esc(shortDate(stats.start))} — ${esc(shortDate(stats.today))}</p></div><div class="journey-calendar-summary"><strong>${number(stats.learningDays)}</strong><span>${esc(tr('أيام فيها كلمات جديدة'))}</span></div></header><div class="journey-calendar-weekdays" aria-hidden="true" dir="ltr">${weekdays}</div><div class="journey-calendar-grid" role="group" aria-label="${esc(tr('اختر يومًا لعرض الكلمات الجديدة المؤرخة'))}" dir="ltr">${buttons}</div><div class="journey-calendar-legend"><span><i class="is-unknown"></i>${esc(tr('غير مسجّل'))}</span><span>${esc(tr('أقل'))}<i data-intensity="0"></i><i data-intensity="1"></i><i data-intensity="2"></i><i data-intensity="3"></i><i data-intensity="4"></i>${esc(tr('أكثر'))}</span></div><div class="journey-calendar-selection" aria-live="polite" aria-atomic="true"><div><strong data-calendar-date></strong><p data-calendar-detail></p></div><span data-calendar-count></span></div><p class="journey-calendar-note">${esc(tr('الألوان تعبّر عن الكلمات الجديدة المؤرخة، ولا تشمل تكرار المراجعة أو إجمالي وقت الاستخدام.'))}${stats.unknownCount?' '+esc(tr('لديك {count} كلمة قديمة بلا تاريخ محفوظ، وتبقى ضمن إجمالي تقدّمك.',{count:number(stats.unknownCount)})):''}</p></section>`;
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
