/* Local learning analytics. Undated legacy progress is never backfilled onto invented dates. */
(function (global) {
  'use strict';
  const instances = new WeakMap();
  const LEVELS = ['A1','A2','B1','B2','C1'];
  const PERIODS = [{days:7,title:'الأسبوع',range:'آخر 7 أيام'},{days:30,title:'الشهر',range:'آخر 30 يومًا'},{days:90,title:'ثلاثة أشهر',range:'آخر 90 يومًا'}];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const number = (value, digits=0) => new Intl.NumberFormat('ar',{maximumFractionDigits:digits,minimumFractionDigits:0}).format(value);
  const axisNumber = value => value>=1000 ? new Intl.NumberFormat('ar',{notation:'compact',maximumFractionDigits:1}).format(value) : number(value);
  const validDay = value => {
    if(typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y,m,d] = value.split('-').map(Number), date = new Date(Date.UTC(y,m-1,d));
    return date.getUTCFullYear()===y && date.getUTCMonth()===m-1 && date.getUTCDate()===d;
  };
  function dateFromDay(key) { const [y,m,d]=key.split('-').map(Number); return new Date(y,m-1,d,12); }
  function dayKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
  function addDays(key, amount) { const date=dateFromDay(key);date.setDate(date.getDate()+amount);return dayKey(date); }
  function todayKey(now) {
    if(validDay(now))return now;
    const date=now instanceof Date ? now : now ? new Date(now) : new Date();
    return dayKey(Number.isFinite(date.getTime())?date:new Date());
  }
  function fullDate(day) { return new Intl.DateTimeFormat('ar',{calendar:'gregory',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(dateFromDay(day)); }
  function shortDate(day) { return new Intl.DateTimeFormat('ar',{calendar:'gregory',day:'numeric',month:'numeric'}).format(dateFromDay(day)); }
  function idLevel(id) {
    if(typeof id==='number' && id>=0 && id<90)return LEVELS[Math.floor(id/18)];
    const code=String(id).split(':')[0];return LEVELS.includes(code)?code:null;
  }
  function normalize(model) {
    const history = model?.history || {}, today=todayKey(model?.now);
    const rows = Array.isArray(history.events)?history.events:[];
    const unique=new Map();
    for(const event of rows) {
      if(!event || !['string','number'].includes(typeof event.id) || !validDay(event.day) || event.day>today)continue;
      const level=LEVELS.includes(event.level)?event.level:idLevel(event.id);
      const key=String(event.id), previous=unique.get(key);
      if(!previous || event.day<previous.day)unique.set(key,{id:event.id,day:event.day,level});
    }
    let startedAt=validDay(history.startedAt)?history.startedAt:today;
    if(startedAt>today)startedAt=today;
    const undated=Array.isArray(history.undatedIds)?history.undatedIds:[];
    const unknownCount=Number.isFinite(model?.unknownCount)?Math.max(0,model.unknownCount):undated.length;
    return {today,startedAt,events:[...unique.values()],undated,unknownCount,model:model||{}};
  }
  function calculate(model, period=7, level='all') {
    const data=normalize(model), days=[7,30,90].includes(Number(period))?Number(period):7;
    const start=addDays(data.today,1-days), previousStart=addDays(start,-days), previousEnd=addDays(start,-1);
    const counts=new Map(), events=data.events.filter(event=>level==='all'||event.level===level);
    for(const event of events)counts.set(event.day,(counts.get(event.day)||0)+1);
    const series=Array.from({length:days},(_,index)=>{
      const day=addDays(start,index);return {day,count:counts.get(day)||0,known:day>=data.startedAt};
    });
    let cumulative=0;
    for(const item of series){cumulative+=item.count;item.cumulative=cumulative;}
    const total=series.reduce((n,item)=>n+item.count,0), knownSeries=series.filter(item=>item.known);
    const knownTotal=knownSeries.reduce((n,item)=>n+item.count,0), activeDays=series.filter(item=>item.count>0).length;
    const best=series.reduce((best,item)=>item.count>best.count?item:best,{day:null,count:0});
    const previousTotal=events.filter(event=>event.day>=previousStart&&event.day<=previousEnd).length;
    const comparisonAvailable=previousStart>=data.startedAt;
    const change=total-previousTotal, percentChange=previousTotal?change/previousTotal*100:null;
    let longest=0, run=0;
    for(const item of series){run=item.known&&item.count>0?run+1:0;longest=Math.max(longest,run);}
    let currentStreak=0,cursor=data.today;
    if(!counts.get(cursor))cursor=addDays(cursor,-1);
    while(cursor>=data.startedAt&&(counts.get(cursor)||0)>0){currentStreak++;cursor=addDays(cursor,-1);}
    const unknownCount=level==='all'?data.unknownCount:data.undated.filter(id=>idLevel(id)===level).length;
    return {...data,days,level,start,series,total,knownTotal,knownDays:knownSeries.length,unknownDays:days-knownSeries.length,activeDays,best,
      average:knownSeries.length?knownTotal/knownSeries.length:0,previousStart,previousEnd,previousTotal,comparisonAvailable,change,percentChange,currentStreak,longest,unknownCount};
  }
  function niceMaximum(value) {
    const target=Math.max(1,value)/4, power=Math.pow(10,Math.floor(Math.log10(target))), ratio=target/power;
    const step=Math.max(1,(ratio<=1?1:ratio<=2?2:ratio<=5?5:10)*power);
    return step*4;
  }
  function chartGeometry(width) {
    const W=Math.max(240,Math.round(width)||800),compact=W<500;
    return {W,H:compact?248:300,left:compact?38:54,right:16,top:18,bottom:compact?38:44};
  }
  function chartSvg(stats,mode,selectedDay,uid,geometry) {
    const {W,H,left,right,top,bottom}=geometry,plotW=W-left-right,plotH=H-top-bottom;
    const series=stats.series, selectedIndex=Math.max(0,series.findIndex(item=>item.day===selectedDay));
    const metric=item=>mode==='cumulative'?item.cumulative:item.count;
    const max=niceMaximum(Math.max(0,...series.map(metric))), step=plotW/series.length;
    const x=index=>left+step*(index+.5), y=value=>top+plotH-value/max*plotH;
    const chosen=series[selectedIndex];
    const ticks=Array.from({length:5},(_,index)=>{const value=max/4*index,yy=y(value);return `<line class="analytics-gridline" x1="${left}" x2="${W-right}" y1="${yy}" y2="${yy}"/><text class="analytics-axis-label" x="${left-11}" y="${yy+4}" text-anchor="end">${axisNumber(value)}</text>`;}).join('');
    const unknown=series.filter(item=>!item.known).map(item=>{
      const index=series.indexOf(item);return `<rect class="analytics-unknown-zone" x="${left+step*index}" y="${top}" width="${step+.2}" height="${plotH}" fill="url(#${uid}-hatch)"/>`;
    }).join('');
    const selectedGuide=`<line class="analytics-guide" x1="${x(selectedIndex)}" x2="${x(selectedIndex)}" y1="${top}" y2="${top+plotH}"/>`;
    let graph='';
    if(mode==='daily') {
      graph=series.map((item,index)=>{
        const height=item.count>0?Math.max(2,item.count/max*plotH):0,barW=Math.max(2,Math.min(56,step*.65));
        const title=`${fullDate(item.day)}: ${item.known?number(item.count)+' كلمة':item.count?number(item.count)+' كلمة مؤرخة؛ السجل غير مكتمل':'لا توجد بيانات مؤرخة'}`;
        if(item.count>0)return `<rect class="analytics-bar ${item.day===selectedDay?'is-selected':''}" x="${x(index)-barW/2}" y="${top+plotH-height}" width="${barW}" height="${height}" rx="${Math.min(5,barW/3)}" data-analytics-day="${index}" fill="url(#${uid}-bar)"><title>${esc(title)}</title></rect>`;
        return item.known?`<line class="analytics-zero" x1="${x(index)-Math.min(6,barW/2)}" x2="${x(index)+Math.min(6,barW/2)}" y1="${top+plotH}" y2="${top+plotH}" data-analytics-day="${index}"><title>${esc(title)}</title></line>`:'';
      }).join('');
    } else {
      const known=series.map((item,index)=>({...item,index})).filter(item=>item.known);
      if(known.length){
        const points=known.map(item=>`${x(item.index)},${y(item.cumulative)}`);
        const first=known[0],last=known[known.length-1];
        graph=`<path class="analytics-area" d="M${x(first.index)},${top+plotH} L${points.join(' L')} L${x(last.index)},${top+plotH} Z" fill="url(#${uid}-area)"/><polyline class="analytics-cumulative-line" points="${points.join(' ')}"/>${known.map(item=>`<circle class="analytics-point ${item.day===selectedDay?'is-selected':''}" cx="${x(item.index)}" cy="${y(item.cumulative)}" r="${item.day===selectedDay?5:stats.days===7?3:1.8}" data-analytics-day="${item.index}"><title>${esc(fullDate(item.day))}: ${number(item.cumulative)} كلمة مسجلة داخل الفترة</title></circle>`).join('')}`;
      }
    }
    const labelCount=W<500?4:stats.days===7?7:6,indices=new Set([0,stats.days-1]);
    for(let i=0;i<labelCount;i++)indices.add(Math.round((stats.days-1)*i/(labelCount-1)));
    const labels=[...indices].sort((a,b)=>a-b).map(index=>`<text class="analytics-axis-label" x="${x(index)}" y="${H-17}" text-anchor="middle">${esc(shortDate(series[index].day))}</text>`).join('');
    const empty=stats.total===0?`<text class="analytics-empty" x="${left+plotW/2}" y="${top+plotH*.43}" text-anchor="middle">لم تُسجَّل كلمات جديدة في هذه الفترة</text>`:'';
    const marker=chosen.known||chosen.count?`<circle class="analytics-selected-point" cx="${x(selectedIndex)}" cy="${y(metric(chosen))}" r="5"/>`:'';
    return `<svg class="analytics-svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${uid}-title ${uid}-description" dir="ltr"><title id="${uid}-title">${mode==='daily'?'الكلمات الجديدة كل يوم':'إجمالي الكلمات المؤرخة داخل الفترة'}</title><desc id="${uid}-description">${stats.days} يومًا من ${fullDate(stats.start)} إلى ${fullDate(stats.today)}. ${stats.total} كلمة مؤرخة. المناطق المظللة تسبق بدء السجل ولا تمثل صفرًا. استخدم شريط التاريخ أسفل الرسم لقراءة الأرقام.</desc><defs><linearGradient id="${uid}-bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#78b8ff"/><stop offset="1" stop-color="#3f7ed9"/></linearGradient><linearGradient id="${uid}-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b94ff" stop-opacity=".35"/><stop offset="1" stop-color="#4b94ff" stop-opacity=".02"/></linearGradient><pattern id="${uid}-hatch" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#171d27"/><path d="M-2 2 2-2M0 8 8 0M6 10 10 6" stroke="#354153" stroke-width="1"/></pattern></defs>${unknown}${ticks}${selectedGuide}${graph}${marker}${labels}${empty}</svg>`;
  }
  function comparisonText(stats) {
    if(!stats.comparisonAvailable)return {className:'is-unavailable',text:'المقارنة بالفترة السابقة غير متاحة بعد؛ السجل لا يغطي الفترتين كاملتين.'};
    const sign=stats.change>0?'+':stats.change<0?'−':'', amount=number(Math.abs(stats.change));
    if(stats.change===0)return {className:'neutral',text:'العدد مماثل للفترة السابقة: '+number(stats.previousTotal)+' كلمة.'};
    const percent=stats.percentChange===null?'':` (${sign}${number(Math.abs(stats.percentChange),1)}٪)`;
    return {className:stats.change>0?'positive':'negative',text:`${sign}${amount} كلمة${percent} مقارنة بالـ${number(stats.days)} يومًا السابقة.`};
  }
  function selectedDescription(item,mode) {
    if(!item.known&&!item.count)return 'لا تتوفر بيانات مؤرخة لهذا اليوم؛ لا يُحتسب على أنه صفر.';
    if(!item.known)return `${number(item.count)} كلمة مؤرخة لهذا اليوم، وقد توجد كلمات أخرى بلا تاريخ.`;
    if(!item.count)return mode==='cumulative'?`لم تُسجَّل كلمات جديدة؛ الإجمالي المؤرخ داخل الفترة ${number(item.cumulative)} كلمة.`:'لم تُسجَّل كلمات جديدة في هذا اليوم.';
    return `${number(item.count)} كلمة جديدة${mode==='cumulative'?' · الإجمالي داخل الفترة '+number(item.cumulative):''}.`;
  }
  let instanceCount=0;
  function mount(container, initialModel={}) {
    if(!container?.querySelector)throw new TypeError('Analytics requires a container element.');
    instances.get(container)?.destroy();
    const uid=`wort-analytics-${++instanceCount}`;
    let model=initialModel,period=7,level='all',mode='daily',selectedDay=null,stats=null,geometry=chartGeometry(800),lastWidth=0;
    try{const preference=JSON.parse(localStorage.getItem('wort-analytics-preferences')||'{}');if([7,30,90].includes(preference.period))period=preference.period;if(['daily','cumulative'].includes(preference.mode))mode=preference.mode;}catch{}
    const find=selector=>container.querySelector(selector);
    function remember(){try{localStorage.setItem('wort-analytics-preferences',JSON.stringify({period,mode}));}catch{}}
    function selectedItem(){return stats.series.find(item=>item.day===selectedDay)||stats.series[stats.series.length-1];}
    function updateDay() {
      const item=selectedItem(),index=stats.series.indexOf(item);selectedDay=item.day;
      const surface=find('[data-analytics-chart]');
      lastWidth=surface.clientWidth||container.clientWidth||800;geometry=chartGeometry(lastWidth);
      surface.innerHTML=chartSvg(stats,mode,selectedDay,uid,geometry);
      find('[data-analytics-date-label]').textContent=fullDate(item.day);
      find('[data-analytics-detail]').textContent=selectedDescription(item,mode);
      find('[data-analytics-selected-count]').textContent=!item.known&&!item.count?'—':number(mode==='cumulative'?item.cumulative:item.count);
      find('[data-analytics-selected-unit]').textContent=mode==='cumulative'?'مسجّلة في الفترة':'مسجّلة في اليوم';
      find('[data-analytics-day-range]').value=String(index);
      find('[data-analytics-day-range]').setAttribute('aria-valuetext',fullDate(item.day)+'؛ '+selectedDescription(item,mode));
      find('[data-analytics-date]').value=item.day;
      find('[data-analytics-move="-1"]').disabled=index===0;
      find('[data-analytics-move="1"]').disabled=index===stats.series.length-1;
    }
    function selectDay(index){const item=stats.series[Math.max(0,Math.min(stats.series.length-1,index))];if(item){selectedDay=item.day;updateDay();}}
    function render() {
      stats=calculate(model,period,level);
      if(!stats.series.some(item=>item.day===selectedDay))selectedDay=stats.today;
      const comparisons=comparisonText(stats);
      const periods=PERIODS.map(config=>{const summary=calculate(model,config.days,level);return `<button type="button" class="analytics-period" data-analytics-period="${config.days}" aria-pressed="${period===config.days}"><span>${config.title}</span><strong>${number(summary.total)}</strong><small>${config.range} · كلمات مؤرخة</small></button>`;}).join('');
      const unknownNotice=stats.unknownCount?`<p class="analytics-history-gap">لديك ${number(stats.unknownCount)} كلمة متعلَّمة بلا تاريخ محفوظ. تبقى في إجمالي تقدّمك، ولا نوزّعها على الأسبوع أو الشهر بالتخمين.</p>`:'';
      const coverageNotice=stats.unknownDays?`السجل المتصل يبدأ في ${shortDate(stats.startedAt)}؛ ${number(stats.unknownDays)} يومًا من هذه الفترة تسبقه. التظليل يعني غياب بيانات، وليس صفرًا.`:`السجل يغطي أيام الفترة المعروضة؛ اليوم الجاري يتحدّث مع تعلّمك.`;
      container.innerHTML=`<section class="analytics-dashboard" aria-labelledby="${uid}-heading"><div class="analytics-heading"><div><p class="eyebrow">شاهد عاداتك، لا الرقم فقط</p><h2 id="${uid}-heading">إحصاءات التعلّم</h2><p>كلمات جديدة تعلّمتها للمرة الأولى. المراجعة المتكررة لا تضاعف العدد.</p></div><span class="analytics-coverage">${number(stats.knownDays)} من ${number(stats.days)} يومًا ضمن السجل</span></div><div class="analytics-periods" role="group" aria-label="اختر الفترة الزمنية">${periods}</div><div class="analytics-toolbar"><label class="analytics-level">المستوى<select data-analytics-level aria-label="تصفية إحصاءات التعلّم بالمستوى"><option value="all" ${level==='all'?'selected':''}>كل المستويات</option>${LEVELS.map(code=>`<option value="${code}" ${level===code?'selected':''}>${code}</option>`).join('')}</select></label><div class="analytics-modes" role="group" aria-label="نوع المخطط"><button type="button" data-analytics-mode="daily" aria-pressed="${mode==='daily'}">يومي</button><button type="button" data-analytics-mode="cumulative" aria-pressed="${mode==='cumulative'}">تراكمي للفترة</button></div></div><article class="analytics-chart-card"><header class="analytics-chart-header"><div class="analytics-chart-title"><h3>${mode==='daily'?'نشاطك يومًا بيوم':'تراكم الكلمات داخل الفترة'}</h3><p>${esc(fullDate(stats.start))} — ${esc(fullDate(stats.today))}</p></div><span class="analytics-chart-total"><strong>${number(stats.total)}</strong><small>كلمة مؤرخة</small></span></header><p class="analytics-comparison ${comparisons.className}">${esc(comparisons.text)}</p><div class="analytics-legend"><span><i class="${mode==='daily'?'known':'cumulative'}"></i>${mode==='daily'?'كلمات جديدة':'إجمالي مؤرخ من بداية الفترة'}</span>${stats.unknownDays?'<span><i class="unknown"></i>بيانات غير متاحة</span>':''}</div><div class="analytics-chart-surface" data-analytics-chart tabindex="0" aria-label="مخطط التعلّم؛ استخدم سهمَي اليمين واليسار لاختيار يوم" aria-describedby="${uid}-chart-help"></div><p class="analytics-chart-help" id="${uid}-chart-help">اضغط يومًا في الرسم، أو حرّك شريط التاريخ لعرض تفاصيله.</p><div class="analytics-tooltip" aria-live="polite" aria-atomic="true"><div class="analytics-tooltip-text"><strong data-analytics-date-label></strong><span data-analytics-detail></span></div><div class="analytics-tooltip-value"><strong data-analytics-selected-count></strong><small data-analytics-selected-unit></small></div></div><div class="analytics-day-controls"><button type="button" class="secondary" data-analytics-move="-1" aria-label="اليوم السابق">←</button><input type="range" min="0" max="${stats.days-1}" step="1" data-analytics-day-range aria-label="اختر يومًا من الفترة"><input type="date" min="${stats.start}" max="${stats.today}" data-analytics-date aria-label="تاريخ تفاصيل التعلّم"><button type="button" class="secondary" data-analytics-move="1" aria-label="اليوم التالي">→</button></div></article><div class="analytics-detail-summary"><article class="analytics-stat"><span>المتوسط اليومي</span><strong>${number(stats.average,1)}</strong><small>كلمة / يوم ضمن السجل</small></article><article class="analytics-stat"><span>أيام النشاط</span><strong>${number(stats.activeDays)}</strong><small>يومًا فيه تعلّم مؤرّخ</small></article><article class="analytics-stat"><span>أفضل يوم مسجّل</span><strong>${number(stats.best.count)}</strong><small>${stats.best.day?esc(shortDate(stats.best.day)):'لا يوجد نشاط مسجّل'}</small></article><article class="analytics-stat"><span>سلسلتك الحالية</span><strong>${number(stats.currentStreak)}</strong><small>أطول سلسلة في الفترة: ${number(stats.longest)} يومًا</small></article></div><div class="analytics-history-note"><p>${esc(coverageNotice)}</p>${unknownNotice}<p>الأرقام تخص الكلمات الجديدة المؤرخة في هذا المتصفح. عرض «تراكمي» يبدأ من بداية الفترة المختارة، وليس من إجمالي العمر الدراسي.</p></div></section>`;
      updateDay();
    }
    function onClick(event) {
      const button=event.target.closest('[data-analytics-period],[data-analytics-mode],[data-analytics-move]');
      if(button&&container.contains(button)) {
        if(button.hasAttribute('data-analytics-period')){period=Number(button.dataset.analyticsPeriod);remember();render();find(`[data-analytics-period="${period}"]`)?.focus({preventScroll:true});}
        else if(button.hasAttribute('data-analytics-mode')){mode=button.dataset.analyticsMode;remember();render();find(`[data-analytics-mode="${mode}"]`)?.focus({preventScroll:true});}
        else selectDay(stats.series.findIndex(item=>item.day===selectedDay)+Number(button.dataset.analyticsMove));
        return;
      }
      const point=event.target.closest('[data-analytics-day]');
      if(point&&container.contains(point)){selectDay(Number(point.dataset.analyticsDay));return;}
      const surface=event.target.closest('[data-analytics-chart]');
      if(surface&&container.contains(surface)){
        const box=surface.getBoundingClientRect(),fraction=(event.clientX-box.left)/box.width;
        selectDay(Math.round((fraction*geometry.W-geometry.left)/(geometry.W-geometry.left-geometry.right)*stats.days-.5));
      }
    }
    function onInput(event){if(event.target.matches('[data-analytics-day-range]'))selectDay(Number(event.target.value));}
    function onChange(event){
      if(event.target.matches('[data-analytics-level]')){level=event.target.value;render();find('[data-analytics-level]')?.focus({preventScroll:true});}
      if(event.target.matches('[data-analytics-date]')){const index=stats.series.findIndex(item=>item.day===event.target.value);if(index>=0)selectDay(index);else updateDay();}
    }
    function onKeydown(event){
      if(!event.target.matches('[data-analytics-chart]'))return;
      if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
        event.preventDefault();const index=stats.series.findIndex(item=>item.day===selectedDay);
        selectDay(event.key==='Home'?0:event.key==='End'?stats.days-1:index+(event.key==='ArrowRight'?1:-1));
      }
    }
    function onResize(){const surface=find('[data-analytics-chart]');if(surface&&surface.clientWidth&&surface.clientWidth!==lastWidth)updateDay();}
    const observer=typeof ResizeObserver==='function'?new ResizeObserver(onResize):null;observer?.observe(container);global.addEventListener?.('resize',onResize);
    container.addEventListener('click',onClick);container.addEventListener('input',onInput);container.addEventListener('change',onChange);container.addEventListener('keydown',onKeydown);
    const api={update(nextModel){model=nextModel||{};render();},destroy(){container.removeEventListener('click',onClick);container.removeEventListener('input',onInput);container.removeEventListener('change',onChange);container.removeEventListener('keydown',onKeydown);observer?.disconnect();global.removeEventListener?.('resize',onResize);instances.delete(container);}};
    instances.set(container,api);render();return api;
  }
  global.WORT_ANALYTICS=Object.freeze({mount,calculate});
})(globalThis);
