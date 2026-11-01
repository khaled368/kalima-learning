/* Local learning analytics. Undated legacy progress is never backfilled onto invented dates. */
(function (global) {
  'use strict';

  const languageCourse=globalThis.WORT_COURSE||{};
  const nativeLanguage=languageCourse.native||'ar', locale=languageCourse.locale||nativeLanguage;
  const targetLanguage=languageCourse.target||'de';
  const languageDirection=code=>languageCourse.dir?.(code)||(code==='ar'?'rtl':'ltr');
  const translationRows=[["الأسبوع","Week","Week","Woche"],["الشهر","Month","Maand","Monat"],["ثلاثة أشهر","Three months","Drie maanden","Drei Monate"],["آخر 7 أيام","Last 7 days","Afgelopen 7 dagen","Letzte 7 Tage"],["آخر 30 يومًا","Last 30 days","Afgelopen 30 dagen","Letzte 30 Tage"],["آخر 90 يومًا","Last 90 days","Afgelopen 90 dagen","Letzte 90 Tage"],["{count} كلمة","{count} words","{count} woorden","{count} Wörter"],["{count} كلمة مؤرخة؛ السجل غير مكتمل","{count} dated words; history is incomplete","{count} woorden met datum; geschiedenis is onvolledig","{count} datierte Wörter; der Verlauf ist unvollständig"],["لا توجد بيانات مؤرخة","No dated data","Geen gegevens met datum","Keine datierten Daten"],["{count} كلمة مسجلة داخل الفترة","{count} words recorded in this period","{count} woorden vastgelegd in deze periode","{count} Wörter in diesem Zeitraum erfasst"],["لم تُسجَّل كلمات جديدة في هذه الفترة","No new words recorded in this period","Geen nieuwe woorden vastgelegd in deze periode","Keine neuen Wörter in diesem Zeitraum erfasst"],["الكلمات الجديدة كل يوم","New words each day","Nieuwe woorden per dag","Neue Wörter pro Tag"],["إجمالي الكلمات المؤرخة داخل الفترة","Total dated words in this period","Totaal woorden met datum in deze periode","Datierte Wörter im Zeitraum insgesamt"],["{days} يومًا من {start} إلى {end}. {count} كلمة مؤرخة. المناطق المظللة تسبق بدء السجل ولا تمثل صفرًا. استخدم شريط التاريخ أسفل الرسم لقراءة الأرقام.","{days} days from {start} to {end}. {count} dated words. Shaded areas precede the recorded history and do not mean zero. Use the date slider below the chart to read the values.","{days} dagen van {start} tot {end}. {count} woorden met datum. Gearceerde gebieden vallen vóór de registratie en betekenen niet nul. Gebruik de datumschuif onder de grafiek om de waarden te lezen.","{days} Tage von {start} bis {end}. {count} datierte Wörter. Schraffierte Bereiche liegen vor Beginn der Aufzeichnung und bedeuten nicht null. Die Werte lassen sich mit dem Datumsregler unter dem Diagramm ablesen."],["المقارنة بالفترة السابقة غير متاحة بعد؛ السجل لا يغطي الفترتين كاملتين.","A comparison with the previous period is not available yet; the history does not cover both periods in full.","Vergelijken met de vorige periode is nog niet mogelijk; de geschiedenis dekt beide perioden niet volledig.","Ein Vergleich mit dem vorherigen Zeitraum ist noch nicht möglich; der Verlauf deckt beide Zeiträume nicht vollständig ab."],["العدد مماثل للفترة السابقة: {count} كلمة.","Same as the previous period: {count} words.","Evenveel als in de vorige periode: {count} woorden.","So viele wie im vorherigen Zeitraum: {count} Wörter."],["{change} كلمة{percent} مقارنة بالـ{days} يومًا السابقة.","{change} words{percent} compared with the previous {days} days.","{change} woorden{percent} vergeleken met de vorige {days} dagen.","{change} Wörter{percent} im Vergleich zu den vorherigen {days} Tagen."],["لا تتوفر بيانات مؤرخة لهذا اليوم؛ لا يُحتسب على أنه صفر.","No dated data is available for this day; it is not counted as zero.","Voor deze dag zijn geen gegevens met datum beschikbaar; dit telt niet als nul.","Für diesen Tag liegen keine datierten Daten vor; er zählt nicht als null."],["{count} كلمة مؤرخة لهذا اليوم، وقد توجد كلمات أخرى بلا تاريخ.","{count} words are dated to this day; other words may have no date.","{count} woorden hebben deze datum; andere woorden kunnen zonder datum zijn.","{count} Wörter sind diesem Tag zugeordnet; weitere Wörter können ohne Datum sein."],["لم تُسجَّل كلمات جديدة؛ الإجمالي المؤرخ داخل الفترة {count} كلمة.","No new words recorded; the dated total within this period is {count} words.","Geen nieuwe woorden vastgelegd; het totaal met datum in deze periode is {count} woorden.","Keine neuen Wörter erfasst; die datierte Summe in diesem Zeitraum beträgt {count} Wörter."],["لم تُسجَّل كلمات جديدة في هذا اليوم.","No new words recorded on this day.","Op deze dag zijn geen nieuwe woorden vastgelegd.","An diesem Tag wurden keine neuen Wörter erfasst."],["{count} كلمة جديدة.","{count} new words.","{count} nieuwe woorden.","{count} neue Wörter."],["{count} كلمة جديدة · الإجمالي داخل الفترة {total}.","{count} new words · total in this period: {total}.","{count} nieuwe woorden · totaal in deze periode: {total}.","{count} neue Wörter · Summe im Zeitraum: {total}."],["مسجّلة في الفترة","recorded in period","vastgelegd in periode","im Zeitraum erfasst"],["مسجّلة في اليوم","recorded on day","vastgelegd op dag","am Tag erfasst"],["كلمات مؤرخة","dated words","woorden met datum","datierte Wörter"],["لديك {count} كلمة متعلَّمة بلا تاريخ محفوظ. تبقى في إجمالي تقدّمك، ولا نوزّعها على الأسبوع أو الشهر بالتخمين.","You have {count} learned words without a saved date. They remain in your total progress and are not assigned to a week or month by guesswork.","Je hebt {count} geleerde woorden zonder opgeslagen datum. Ze blijven meetellen voor je totale voortgang en worden niet op basis van een schatting aan een week of maand toegewezen.","Du hast {count} gelernte Wörter ohne gespeichertes Datum. Sie zählen weiterhin zum Gesamtfortschritt und werden keinem Zeitraum auf Verdacht zugeordnet."],["السجل المتصل يبدأ في {date}؛ {days} يومًا من هذه الفترة تسبقه. التظليل يعني غياب بيانات، وليس صفرًا.","Continuous history starts on {date}; {days} days in this period precede it. Shading means missing data, not zero.","De aaneengesloten geschiedenis begint op {date}; {days} dagen in deze periode vallen daarvoor. Arcering betekent ontbrekende gegevens, niet nul.","Der zusammenhängende Verlauf beginnt am {date}; {days} Tage dieses Zeitraums liegen davor. Die Schraffierung steht für fehlende Daten, nicht für null."],["السجل يغطي أيام الفترة المعروضة؛ اليوم الجاري يتحدّث مع تعلّمك.","The history covers this period; today updates as you learn.","De geschiedenis dekt deze periode; vandaag wordt bijgewerkt terwijl je leert.","Der Verlauf deckt diesen Zeitraum ab; der heutige Tag wird beim Lernen aktualisiert."],["شاهد عاداتك، لا الرقم فقط","See your learning habits","Bekijk je leergewoonten","Deine Lerngewohnheiten im Blick"],["إحصاءات التعلّم","Learning statistics","Leerstatistieken","Lernstatistik"],["كلمات جديدة تعلّمتها للمرة الأولى. المراجعة المتكررة لا تضاعف العدد.","New words learned for the first time. Repeated review does not increase the count.","Nieuwe woorden die je voor het eerst hebt geleerd. Opnieuw herhalen verhoogt het aantal niet.","Wörter, die du zum ersten Mal gelernt hast. Wiederholungen erhöhen die Anzahl nicht."],["{known} من {days} يومًا ضمن السجل","{known} of {days} days recorded","{known} van {days} dagen vastgelegd","{known} von {days} Tagen erfasst"],["اختر الفترة الزمنية","Choose a time period","Kies een periode","Zeitraum auswählen"],["المستوى","Level","Niveau","Niveau"],["تصفية إحصاءات التعلّم بالمستوى","Filter learning statistics by level","Filter leerstatistieken op niveau","Lernstatistik nach Niveau filtern"],["كل المستويات","All levels","Alle niveaus","Alle Niveaus"],["نوع المخطط","Chart type","Grafiektype","Diagrammtyp"],["يومي","Daily","Dagelijks","Täglich"],["تراكمي للفترة","Cumulative for period","Cumulatief per periode","Kumuliert im Zeitraum"],["نشاطك يومًا بيوم","Your daily activity","Je dagelijkse activiteit","Deine tägliche Aktivität"],["تراكم الكلمات داخل الفترة","Words accumulated in this period","Opgebouwde woorden in deze periode","Gesammelte Wörter im Zeitraum"],["كلمة مؤرخة","dated words","woorden met datum","datierte Wörter"],["كلمات جديدة","New words","Nieuwe woorden","Neue Wörter"],["إجمالي مؤرخ من بداية الفترة","Dated total from the start of this period","Totaal met datum vanaf het begin van de periode","Datierte Summe seit Beginn des Zeitraums"],["بيانات غير متاحة","Data unavailable","Geen gegevens beschikbaar","Keine Daten verfügbar"],["مخطط التعلّم؛ استخدم سهمَي اليمين واليسار لاختيار يوم","Learning chart; use the left and right arrows to select a day","Leergrafiek; gebruik de linker- en rechterpijl om een dag te kiezen","Lerndiagramm; wähle mit der linken und rechten Pfeiltaste einen Tag"],["اضغط يومًا في الرسم، أو حرّك شريط التاريخ لعرض تفاصيله.","Select a day in the chart or move the date slider to see its details.","Kies een dag in de grafiek of verplaats de datumschuif om de details te zien.","Wähle einen Tag im Diagramm oder mit dem Datumsregler, um Details zu sehen."],["اليوم السابق","Previous day","Vorige dag","Vorheriger Tag"],["اختر يومًا من الفترة","Choose a day in this period","Kies een dag in deze periode","Tag im Zeitraum auswählen"],["تاريخ تفاصيل التعلّم","Date of learning details","Datum van leerdetails","Datum der Lerndetails"],["اليوم التالي","Next day","Volgende dag","Nächster Tag"],["المتوسط اليومي","Daily average","Dagelijks gemiddelde","Tagesdurchschnitt"],["كلمة / يوم ضمن السجل","words per recorded day","woorden per vastgelegde dag","Wörter je erfasstem Tag"],["أيام النشاط","Active days","Actieve dagen","Aktive Tage"],["يومًا فيه تعلّم مؤرّخ","days with dated learning","dagen met leren op datum","Tage mit datiertem Lernen"],["أفضل يوم مسجّل","Best recorded day","Beste vastgelegde dag","Bester erfasster Tag"],["لا يوجد نشاط مسجّل","No recorded activity","Geen activiteit vastgelegd","Keine Aktivität erfasst"],["سلسلتك الحالية","Current streak","Huidige reeks","Aktuelle Serie"],["أطول سلسلة في الفترة: {days} يومًا","Longest streak in period: {days} days","Langste reeks in de periode: {days} dagen","Längste Serie im Zeitraum: {days} Tage"],["الأرقام تخص الكلمات الجديدة المؤرخة في هذا المتصفح. عرض «تراكمي» يبدأ من بداية الفترة المختارة، وليس من إجمالي العمر الدراسي.","These figures count newly learned words with dates in this browser. The cumulative view starts at the beginning of the selected period, not at the start of all your learning.","Deze cijfers tellen nieuw geleerde woorden met datum in deze browser. De cumulatieve weergave begint bij de gekozen periode, niet bij het begin van al je leeractiviteiten.","Die Zahlen zählen neu gelernte Wörter mit Datum in diesem Browser. Die kumulierte Ansicht beginnt mit dem gewählten Zeitraum, nicht mit deinem gesamten Lernverlauf."]];
  const translationCatalog={en:{},nl:{},de:{}};
  for(const [source,en,nl,de] of translationRows){translationCatalog.en[source]=en;translationCatalog.nl[source]=nl;translationCatalog.de[source]=de;}
  globalThis.WORT_I18N?.add(translationCatalog);
  function tr(source,params={}){
    if(globalThis.WORT_I18N?.t)return globalThis.WORT_I18N.t(source,params);
    const value=nativeLanguage==='ar'?source:(translationCatalog[nativeLanguage]?.[source]||source);
    return value.replace(/\{(\w+)\}/g,(match,key)=>Object.prototype.hasOwnProperty.call(params,key)?String(params[key]):match);
  }
  const instances = new WeakMap();
  const preferenceKey=languageCourse.key?.('wort-analytics-preferences')||'wort-analytics-preferences';
  const LEVELS = ['A1','A2','B1','B2','C1'];
  const PERIODS = [{days:7,title:'الأسبوع',range:'آخر 7 أيام'},{days:30,title:'الشهر',range:'آخر 30 يومًا'},{days:90,title:'ثلاثة أشهر',range:'آخر 90 يومًا'}];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const number = (value, digits=0) => new Intl.NumberFormat(locale,{maximumFractionDigits:digits,minimumFractionDigits:0}).format(value);
  const axisNumber = value => value>=1000 ? new Intl.NumberFormat(locale,{notation:'compact',maximumFractionDigits:1}).format(value) : number(value);
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
  function fullDate(day) { return new Intl.DateTimeFormat(locale,{calendar:'gregory',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(dateFromDay(day)); }
  function shortDate(day) { return new Intl.DateTimeFormat(locale,{calendar:'gregory',day:'numeric',month:'numeric'}).format(dateFromDay(day)); }
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
        const title=`${fullDate(item.day)}: ${item.known?tr('{count} كلمة',{count:number(item.count)}):item.count?tr('{count} كلمة مؤرخة؛ السجل غير مكتمل',{count:number(item.count)}):tr('لا توجد بيانات مؤرخة')}`;
        if(item.count>0)return `<rect class="analytics-bar ${item.day===selectedDay?'is-selected':''}" x="${x(index)-barW/2}" y="${top+plotH-height}" width="${barW}" height="${height}" rx="${Math.min(5,barW/3)}" data-analytics-day="${index}" fill="url(#${uid}-bar)"><title>${esc(title)}</title></rect>`;
        return item.known?`<line class="analytics-zero" x1="${x(index)-Math.min(6,barW/2)}" x2="${x(index)+Math.min(6,barW/2)}" y1="${top+plotH}" y2="${top+plotH}" data-analytics-day="${index}"><title>${esc(title)}</title></line>`:'';
      }).join('');
    } else {
      const known=series.map((item,index)=>({...item,index})).filter(item=>item.known);
      if(known.length){
        const points=known.map(item=>`${x(item.index)},${y(item.cumulative)}`);
        const first=known[0],last=known[known.length-1];
        graph=`<path class="analytics-area" d="M${x(first.index)},${top+plotH} L${points.join(' L')} L${x(last.index)},${top+plotH} Z" fill="url(#${uid}-area)"/><polyline class="analytics-cumulative-line" points="${points.join(' ')}"/>${known.map(item=>`<circle class="analytics-point ${item.day===selectedDay?'is-selected':''}" cx="${x(item.index)}" cy="${y(item.cumulative)}" r="${item.day===selectedDay?5:stats.days===7?3:1.8}" data-analytics-day="${item.index}"><title>${esc(fullDate(item.day))}: ${esc(tr('{count} كلمة مسجلة داخل الفترة',{count:number(item.cumulative)}))}</title></circle>`).join('')}`;
      }
    }
    const labelCount=W<500?4:stats.days===7?7:6,indices=new Set([0,stats.days-1]);
    for(let i=0;i<labelCount;i++)indices.add(Math.round((stats.days-1)*i/(labelCount-1)));
    const labels=[...indices].sort((a,b)=>a-b).map(index=>`<text class="analytics-axis-label" x="${x(index)}" y="${H-17}" text-anchor="middle">${esc(shortDate(series[index].day))}</text>`).join('');
    const empty=stats.total===0?`<text class="analytics-empty" x="${left+plotW/2}" y="${top+plotH*.43}" text-anchor="middle">${esc(tr('لم تُسجَّل كلمات جديدة في هذه الفترة'))}</text>`:'';
    const marker=chosen.known||chosen.count?`<circle class="analytics-selected-point" cx="${x(selectedIndex)}" cy="${y(metric(chosen))}" r="5"/>`:'';
    return `<svg class="analytics-svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${uid}-title ${uid}-description" dir="ltr"><title id="${uid}-title">${esc(tr(mode==='daily'?'الكلمات الجديدة كل يوم':'إجمالي الكلمات المؤرخة داخل الفترة'))}</title><desc id="${uid}-description">${esc(tr('{days} يومًا من {start} إلى {end}. {count} كلمة مؤرخة. المناطق المظللة تسبق بدء السجل ولا تمثل صفرًا. استخدم شريط التاريخ أسفل الرسم لقراءة الأرقام.',{days:number(stats.days),start:fullDate(stats.start),end:fullDate(stats.today),count:number(stats.total)}))}</desc><defs><linearGradient id="${uid}-bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#78b8ff"/><stop offset="1" stop-color="#3f7ed9"/></linearGradient><linearGradient id="${uid}-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b94ff" stop-opacity=".35"/><stop offset="1" stop-color="#4b94ff" stop-opacity=".02"/></linearGradient><pattern id="${uid}-hatch" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#171d27"/><path d="M-2 2 2-2M0 8 8 0M6 10 10 6" stroke="#354153" stroke-width="1"/></pattern></defs>${unknown}${ticks}${selectedGuide}${graph}${marker}${labels}${empty}</svg>`;
  }
  function comparisonText(stats) {
    if(!stats.comparisonAvailable)return {className:'is-unavailable',text:tr('المقارنة بالفترة السابقة غير متاحة بعد؛ السجل لا يغطي الفترتين كاملتين.')};
    const sign=stats.change>0?'+':stats.change<0?'−':'', amount=number(Math.abs(stats.change));
    if(stats.change===0)return {className:'neutral',text:tr('العدد مماثل للفترة السابقة: {count} كلمة.',{count:number(stats.previousTotal)})};
    const percent=stats.percentChange===null?'':` (${sign}${new Intl.NumberFormat(locale,{style:'percent',maximumFractionDigits:1}).format(Math.abs(stats.percentChange)/100)})`;
    return {className:stats.change>0?'positive':'negative',text:tr('{change} كلمة{percent} مقارنة بالـ{days} يومًا السابقة.',{change:sign+amount,percent,days:number(stats.days)})};
  }
  function selectedDescription(item,mode) {
    if(!item.known&&!item.count)return tr('لا تتوفر بيانات مؤرخة لهذا اليوم؛ لا يُحتسب على أنه صفر.');
    if(!item.known)return tr('{count} كلمة مؤرخة لهذا اليوم، وقد توجد كلمات أخرى بلا تاريخ.',{count:number(item.count)});
    if(!item.count)return mode==='cumulative'?tr('لم تُسجَّل كلمات جديدة؛ الإجمالي المؤرخ داخل الفترة {count} كلمة.',{count:number(item.cumulative)}):tr('لم تُسجَّل كلمات جديدة في هذا اليوم.');
    return mode==='cumulative'?tr('{count} كلمة جديدة · الإجمالي داخل الفترة {total}.',{count:number(item.count),total:number(item.cumulative)}):tr('{count} كلمة جديدة.',{count:number(item.count)});
  }
  let instanceCount=0;
  function mount(container, initialModel={}) {
    if(!container?.querySelector)throw new TypeError('Analytics requires a container element.');
    instances.get(container)?.destroy();
    const uid=`wort-analytics-${++instanceCount}`;
    let model=initialModel,period=7,level='all',mode='daily',selectedDay=null,stats=null,geometry=chartGeometry(800),lastWidth=0;
    try{const preference=JSON.parse(localStorage.getItem(preferenceKey)||'{}');if([7,30,90].includes(preference.period))period=preference.period;if(['daily','cumulative'].includes(preference.mode))mode=preference.mode;}catch{}
    const find=selector=>container.querySelector(selector);
    function remember(){try{localStorage.setItem(preferenceKey,JSON.stringify({period,mode}));}catch{}}
    function selectedItem(){return stats.series.find(item=>item.day===selectedDay)||stats.series[stats.series.length-1];}
    function updateDay() {
      const item=selectedItem(),index=stats.series.indexOf(item);selectedDay=item.day;
      const surface=find('[data-analytics-chart]');
      lastWidth=surface.clientWidth||container.clientWidth||800;geometry=chartGeometry(lastWidth);
      surface.innerHTML=chartSvg(stats,mode,selectedDay,uid,geometry);
      find('[data-analytics-date-label]').textContent=fullDate(item.day);
      find('[data-analytics-detail]').textContent=selectedDescription(item,mode);
      find('[data-analytics-selected-count]').textContent=!item.known&&!item.count?'—':number(mode==='cumulative'?item.cumulative:item.count);
      find('[data-analytics-selected-unit]').textContent=tr(mode==='cumulative'?'مسجّلة في الفترة':'مسجّلة في اليوم');
      find('[data-analytics-day-range]').value=String(index);
      find('[data-analytics-day-range]').setAttribute('aria-valuetext',fullDate(item.day)+(nativeLanguage==='ar'?'؛ ':'; ')+selectedDescription(item,mode));
      find('[data-analytics-date]').value=item.day;
      find('[data-analytics-move="-1"]').disabled=index===0;
      find('[data-analytics-move="1"]').disabled=index===stats.series.length-1;
    }
    function selectDay(index){const item=stats.series[Math.max(0,Math.min(stats.series.length-1,index))];if(item){selectedDay=item.day;updateDay();}}
    function render() {
      stats=calculate(model,period,level);
      if(!stats.series.some(item=>item.day===selectedDay))selectedDay=stats.today;
      const comparisons=comparisonText(stats);
      const periods=PERIODS.map(config=>{const summary=calculate(model,config.days,level);return `<button type="button" class="analytics-period" data-analytics-period="${config.days}" aria-pressed="${period===config.days}"><span>${esc(tr(config.title))}</span><strong>${number(summary.total)}</strong><small>${esc(tr(config.range))} · ${esc(tr('كلمات مؤرخة'))}</small></button>`;}).join('');
      const unknownNotice=stats.unknownCount?`<p class="analytics-history-gap">${esc(tr('لديك {count} كلمة متعلَّمة بلا تاريخ محفوظ. تبقى في إجمالي تقدّمك، ولا نوزّعها على الأسبوع أو الشهر بالتخمين.',{count:number(stats.unknownCount)}))}</p>`:'';
      const coverageNotice=stats.unknownDays?tr('السجل المتصل يبدأ في {date}؛ {days} يومًا من هذه الفترة تسبقه. التظليل يعني غياب بيانات، وليس صفرًا.',{date:shortDate(stats.startedAt),days:number(stats.unknownDays)}):tr('السجل يغطي أيام الفترة المعروضة؛ اليوم الجاري يتحدّث مع تعلّمك.');
      container.innerHTML=`<section class="analytics-dashboard" aria-labelledby="${uid}-heading"><div class="analytics-heading"><div><p class="eyebrow">${esc(tr('شاهد عاداتك، لا الرقم فقط'))}</p><h2 id="${uid}-heading">${esc(tr('إحصاءات التعلّم'))}</h2><p>${esc(tr('كلمات جديدة تعلّمتها للمرة الأولى. المراجعة المتكررة لا تضاعف العدد.'))}</p></div><span class="analytics-coverage">${esc(tr('{known} من {days} يومًا ضمن السجل',{known:number(stats.knownDays),days:number(stats.days)}))}</span></div><div class="analytics-periods" role="group" aria-label="${esc(tr('اختر الفترة الزمنية'))}">${periods}</div><div class="analytics-toolbar"><label class="analytics-level">${esc(tr('المستوى'))}<select data-analytics-level aria-label="${esc(tr('تصفية إحصاءات التعلّم بالمستوى'))}"><option value="all" ${level==='all'?'selected':''}>${esc(tr('كل المستويات'))}</option>${LEVELS.map(code=>`<option value="${code}" ${level===code?'selected':''}>${code}</option>`).join('')}</select></label><div class="analytics-modes" role="group" aria-label="${esc(tr('نوع المخطط'))}"><button type="button" data-analytics-mode="daily" aria-pressed="${mode==='daily'}">${esc(tr('يومي'))}</button><button type="button" data-analytics-mode="cumulative" aria-pressed="${mode==='cumulative'}">${esc(tr('تراكمي للفترة'))}</button></div></div><article class="analytics-chart-card"><header class="analytics-chart-header"><div class="analytics-chart-title"><h3>${esc(tr(mode==='daily'?'نشاطك يومًا بيوم':'تراكم الكلمات داخل الفترة'))}</h3><p>${esc(fullDate(stats.start))} — ${esc(fullDate(stats.today))}</p></div><span class="analytics-chart-total"><strong>${number(stats.total)}</strong><small>${esc(tr('كلمة مؤرخة'))}</small></span></header><p class="analytics-comparison ${comparisons.className}">${esc(comparisons.text)}</p><div class="analytics-legend"><span><i class="${mode==='daily'?'known':'cumulative'}"></i>${esc(tr(mode==='daily'?'كلمات جديدة':'إجمالي مؤرخ من بداية الفترة'))}</span>${stats.unknownDays?`<span><i class="unknown"></i>${esc(tr('بيانات غير متاحة'))}</span>`:''}</div><div class="analytics-chart-surface" data-analytics-chart tabindex="0" aria-label="${esc(tr('مخطط التعلّم؛ استخدم سهمَي اليمين واليسار لاختيار يوم'))}" aria-describedby="${uid}-chart-help"></div><p class="analytics-chart-help" id="${uid}-chart-help">${esc(tr('اضغط يومًا في الرسم، أو حرّك شريط التاريخ لعرض تفاصيله.'))}</p><div class="analytics-tooltip" aria-live="polite" aria-atomic="true"><div class="analytics-tooltip-text"><strong data-analytics-date-label></strong><span data-analytics-detail></span></div><div class="analytics-tooltip-value"><strong data-analytics-selected-count></strong><small data-analytics-selected-unit></small></div></div><div class="analytics-day-controls"><button type="button" class="secondary" data-analytics-move="-1" aria-label="${esc(tr('اليوم السابق'))}">←</button><input type="range" min="0" max="${stats.days-1}" step="1" data-analytics-day-range aria-label="${esc(tr('اختر يومًا من الفترة'))}"><input type="date" min="${stats.start}" max="${stats.today}" data-analytics-date aria-label="${esc(tr('تاريخ تفاصيل التعلّم'))}"><button type="button" class="secondary" data-analytics-move="1" aria-label="${esc(tr('اليوم التالي'))}">→</button></div></article><div class="analytics-detail-summary"><article class="analytics-stat"><span>${esc(tr('المتوسط اليومي'))}</span><strong>${number(stats.average,1)}</strong><small>${esc(tr('كلمة / يوم ضمن السجل'))}</small></article><article class="analytics-stat"><span>${esc(tr('أيام النشاط'))}</span><strong>${number(stats.activeDays)}</strong><small>${esc(tr('يومًا فيه تعلّم مؤرّخ'))}</small></article><article class="analytics-stat"><span>${esc(tr('أفضل يوم مسجّل'))}</span><strong>${number(stats.best.count)}</strong><small>${stats.best.day?esc(shortDate(stats.best.day)):esc(tr('لا يوجد نشاط مسجّل'))}</small></article><article class="analytics-stat"><span>${esc(tr('سلسلتك الحالية'))}</span><strong>${number(stats.currentStreak)}</strong><small>${esc(tr('أطول سلسلة في الفترة: {days} يومًا',{days:number(stats.longest)}))}</small></article></div><div class="analytics-history-note"><p>${esc(coverageNotice)}</p>${unknownNotice}<p>${esc(tr('الأرقام تخص الكلمات الجديدة المؤرخة في هذا المتصفح. عرض «تراكمي» يبدأ من بداية الفترة المختارة، وليس من إجمالي العمر الدراسي.'))}</p></div></section>`;
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
