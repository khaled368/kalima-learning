'use strict';
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');const raw=path.join(root,'data-sources');
const dict=require(path.join(raw,'verb-dict-package/package/dist/verbs.json'));
const lib=require(path.join(raw,'verb-helper-package/package/dist/index.js'));
const principals=JSON.parse(fs.readFileSync(path.join(raw,'verb-principals.json')));
const words=['A1','A2','B1','B2','C1'].flatMap(l=>JSON.parse(fs.readFileSync(path.join(root,'dist/data',l+'.json'))));
const posRepairs=JSON.parse(fs.readFileSync(path.join(raw,'verb-pos-repairs-extra.json')));
const norm=s=>String(s||'').normalize('NFC').toLocaleLowerCase().trim();const aliasNorm=s=>norm(s).replace(/ß/g,'ss').replace(/!/g,'');
const pronouns=['ich','du','er/sie/es','wir','ihr','sie/Sie'];const persons=[[1,'S'],[2,'S'],[3,'S'],[1,'P'],[2,'P'],[3,'P']];
const prefixes=['auseinander','zurück','herunter','hinunter','heraus','hinaus','herein','hinein','zusammen','vorüber','entgegen','vorbei','herbei','wieder','kennen','spazieren','weiter','nieder','hervor','davon','empor','durch','unter','über','umher','voraus','zurecht','herum','voran','vorn','los','hoch','runter','raus','rein','dabei','daran','daher','dazu','davor','darauf','drauf','dran','weg','fort','heim','fehl','fest','frei','nahe','nach','teil','statt','mit','vor','bei','zu','ab','an','auf','aus','ein','um','her','hin','weh','leid','ran','rum'];
const inseparable=['miss','miß','zer','ent','er','ver','be','ge'];
const plainAux={haben:['habe','hast','hat','haben','habt','haben'],sein:['bin','bist','ist','sind','seid','sind']};
const memo=new Map(),building=new Set();
function parts(s){return Array.isArray(s)?s:String(s).trim().split(/\s+/)}
function finiteAndTail(s){const p=parts(s);return[p[0],p.slice(1).join(' ')]}
function bareStem(inf){return inf.endsWith('en')?inf.slice(0,-2):inf.endsWith('n')?inf.slice(0,-1):inf}
function ihrFrom(inf){let stem=bareStem(inf);const epenthetic=/[dt]$/.test(stem)||(/(?:ch|[^aeiouyäöürlh])[mn]$/.test(stem));return stem+(epenthetic?'et':'t')}
function sixPast(value){const [stem,tail]=finiteAndTail(value);let forms;if(stem.endsWith('e'))forms=[stem,stem+'st',stem,stem+'n',stem+'t',stem+'n'];else forms=[stem,stem+(/[dtszß]$/.test(stem)?'est':'st'),stem,stem+'en',stem+(/[dt]$/.test(stem)?'et':'t'),stem+'en'];return forms.map(s=>s+(tail?' '+tail:''))}
function choosePresent(list){if(list.length===3)return list;const ich=list[0];const duIndex=list.findIndex((s,i)=>i>0&&/(st|ßt|zt)$/.test(finiteAndTail(s)[0]));if(duIndex<0)return null;return[ich,list[duIndex],list.slice(duIndex+1).find(s=>!/(st)$/.test(finiteAndTail(s)[0]))||list[list.length-1]]}
function npmRecord(lemma){let pres,past,pp;try{pres=persons.map(([p,n])=>lib.getConjugation(dict,lemma,'PRASENS',p,n).join(' '));past=persons.map(([p,n])=>lib.getConjugation(dict,lemma,'PRATERITUM',p,n).join(' '));pp=lib.getPartizip2(dict,lemma)}catch{return null}return{present:pres,preterite:past,pastParticiple:pp}}
function prefixInfo(lemma,record){const p=parts(record.present[0]);const suffix=p.slice(1).join(' ');if(suffix&&lemma.startsWith(norm(suffix)))return{prefix:suffix,base:lemma.slice(suffix.length)};return{prefix:'',base:lemma}}
function derivePrefix(lemma){
 const info=dict[lemma];let split='';if(info?.['PRÄ']?.S?.['1'] instanceof Array)split=info['PRÄ'].S['1'].slice(1).join(' ');
 const choices=split?[split]:prefixes.filter(p=>lemma.startsWith(p));
 for(const prefix of choices){const base=lemma.slice(prefix.length);if(base.length<3||base===lemma)continue;const b=makeRecord(base,true);if(!b)continue;
  // Without a dictionary entry, only established separated prefixes are used.
  const out={...b,infinitive:lemma,separablePrefix:prefix,lexicalInfinitive:base,lexicalStem:bareStem(base),present:b.present.map(s=>s+' '+prefix),preterite:b.preterite.map(s=>s+' '+prefix),pastParticiple:prefix+b.pastParticiple,source:'LanguageTool/RosaeNLG + regular separable-prefix rule',notes:[...(b.notes||[])]};
  return out;
 }
 return null;
}
const reviewedRegular=new Set(['frühstücken','surfen','klicken','vereinbaren','parkieren','grillieren','schönen','weißen','linken','blauen','outen','blaken','wuffen','jucken','recken','kippeln','kullern','stupsen','wackeln','rasen','knuddeln','verhaken','entzücken','schlecken','schlurfen','picknicken','pupsen','lechzen','wieseln','verorten','relativieren','schwätzen','dividieren','defragmentieren','fieren','hissen','zappen','zoomen','buckeln']);
function regularRecord(lemma){if(!reviewedRegular.has(lemma))return null;let stem=bareStem(lemma);let ich=stem+'e';if(lemma.endsWith('eln'))ich=lemma.slice(0,-3)+'le';const ep=/[dt]$/.test(stem)||/(?:ch|[^aeiouyäöürlh])[mn]$/.test(stem);const du=stem+(ep?'est':/[sßxz]$/.test(stem)?'t':'st'),er=ihrFrom(lemma);const preterite=sixPast(stem+(ep?'ete':'te'));const pp=(lemma.endsWith('ieren')||/^(be|emp|ent|er|ge|miss|ver|zer)/.test(lemma)?'':'ge')+stem+(ep?'et':'t');return{infinitive:lemma,present:[ich,du,er,lemma,er,lemma],preterite,pastParticiple:pp,source:'Reviewed regular German verb rules'}}
function modernize(record,lemma){
 const replace=(text,tense)=>{
  let s=text;
  for(const [old,newValue]of [['muß','muss'],['müß','müss'],['wuß','wuss'],['wüß','wüss'],['wißt','wisst'],['haß','hass'],['paß','pass'],['faß','fass'],['preß','press'],['küß','küss']])s=s.split(old).join(newValue);
  if(lemma.endsWith('lassen'))s=s.replace(/laß/g,'lass').replace(/läß/g,'läss');
  if(['essen','fressen','vergessen','messen'].some(base=>lemma.endsWith(base)))s=s.replace(/iß/g,'iss');
  if(tense==='past')for(const [old,newValue]of [['schloß','schloss'],['schmiß','schmiss'],['riß','riss'],['biß','biss'],['floß','floss'],['genoß','genoss'],['goß','goss'],['schoß','schoss'],['sproß','spross'],['droß','dross']])s=s.split(old).join(newValue);
  return s;
 };
 record.present=record.present.map(s=>replace(s,'present'));
 record.preterite=record.preterite.map(s=>replace(s,'past'));
 record.pastParticiple=replace(record.pastParticiple,'participle');
 return record;
}
function makeRecord(lemma,allowRegular=true){
 lemma=norm(lemma);if(memo.has(lemma))return memo.get(lemma);if(building.has(lemma))return null;building.add(lemma);
 let r=npmRecord(lemma),p=principals[lemma];
 if(lemma==='autofahren'){
  const base=makeRecord('fahren');r={...base,present:base.present.map(x=>x+' Auto'),preterite:base.preterite.map(x=>x+' Auto'),pastParticiple:'Auto gefahren',separablePrefix:'Auto',lexicalInfinitive:'fahren',notes:['المصدر القياسي يُكتب كلمتين: Auto fahren.'],source:'Reviewed German word-group paradigm'};
 }
 if(lemma==='schreiten')r={infinitive:lemma,present:['schreite','schreitest','schreitet','schreiten','schreitet','schreiten'],preterite:['schritt','schrittest','schritt','schritten','schrittet','schritten'],pastParticiple:'geschritten',auxiliary:'sein',notes:[],source:'Reviewed strong German paradigm'};
 if(p&&p.present.length>=3){const first=choosePresent(p.present);if(first){const [_,tail]=finiteAndTail(first[0]);const prefix=tail&&lemma.startsWith(norm(tail))?tail:'';const bare=prefix?lemma.slice(prefix.length):lemma;
  r={...(r||{}),infinitive:lemma,present:[...first,bare+(tail?' '+tail:''),ihrFrom(bare)+(tail?' '+tail:''),bare+(tail?' '+tail:'')],source:'Wiktionary principal parts + German person/number rules'};
  if(p.past.length)r.preterite=sixPast(p.past[0]);if(p.participle.length)r.pastParticiple=p.participle[0];
 }}
 if(!p&&Array.isArray(dict[lemma]?.['PRÄ']?.S?.['1'])){const derived=derivePrefix(lemma);if(derived)r=derived;}
 if(!r||!r.present||!r.preterite||!r.pastParticiple){const derived=derivePrefix(lemma);if(derived)r=derived;}
 // Source verbs with only third-person citation (e.g weather) still have regular person/number paradigms.
 if((!r||!r.present||!r.preterite||!r.pastParticiple)&&p&&p.present.length===1&&p.past.length&&p.participle.length){
  const first=p.present[0];if(first.endsWith('t')&&lemma.endsWith('en')){const stem=bareStem(lemma),ep=/[dt]$/.test(stem)||/(?:ch|[^aeiouyäöürlh])[mn]$/.test(stem);r={infinitive:lemma,present:[stem+'e',stem+(ep?'est':/[sßxz]$/.test(stem)?'t':'st'),first,lemma,ihrFrom(lemma),lemma],preterite:sixPast(p.past[0]),pastParticiple:p.participle[0],source:'Wiktionary principal parts + regular inflection rules',notes:['قد يُستعمل هذا الفعل غالبًا مع ضمير الغائب فقط بحسب معناه.']};}
 }
 if((!r||!r.present||!r.preterite||!r.pastParticiple)&&allowRegular)r=regularRecord(lemma)||r;
 if(r&&r.present?.length===6&&r.preterite?.length===6&&r.pastParticiple){
  r=modernize(r,lemma);
  if(!['sein','wollen','sollen','müssen','können','dürfen','mögen','wissen'].includes(lemma)){
   const [finite,tail]=finiteAndTail(r.present[0]);
   if(!finite.endsWith('e')&&finite!=='—'&&!['bin','weiß','kann','muss','soll','darf','mag','will'].includes(finite))r.present[0]=finite+'e'+(tail?' '+tail:'');
  }
  const info=prefixInfo(lemma,r);r.infinitive=lemma==='autofahren'?'Auto fahren':lemma;r.separablePrefix=r.separablePrefix||info.prefix;r.lexicalInfinitive=r.lexicalInfinitive||info.base;r.lexicalStem=bareStem(r.lexicalInfinitive);
  r.auxiliary=p?.auxiliary?.[0]||r.auxiliary||(lib.alwaysUsesSein(lemma)?'sein':'haben');
  if(lemma==='sein')r.auxiliary='sein';if(lemma==='haben')r.auxiliary='haben';
  if(lemma==='sein'){r.present=['bin','bist','ist','sind','seid','sind'];r.preterite=['war','warst','war','waren','wart','waren'];r.pastParticiple='gewesen';r.lexicalStem='sei';}
  r.perfect=plainAux[r.auxiliary].map(s=>s+' '+r.pastParticiple);r.pronouns=pronouns;r.notes=[...(r.notes||[])];
  if(['kullern','wieseln','schlurfen','rasen'].includes(lemma))r.auxiliary='sein';
  r.perfect=plainAux[r.auxiliary].map(s=>s+' '+r.pastParticiple);
  if(['regnen','hageln'].includes(lemma)){
   for(const tense of ['present','preterite','perfect'])r[tense]=r[tense].map((form,index)=>index===2?form:'—');r.impersonal=true;r.validPersons=[2];r.notes.push('في معنى الطقس يُستعمل هذا الفعل مع es فقط؛ الشرطات تعني أن الشخص غير مستعمل في هذا المعنى.');
  }
  if(['geschehen','passieren','ereignen','erfolgen'].includes(lemma)){
   for(const tense of ['present','preterite','perfect'])r[tense]=r[tense].map((form,index)=>[2,5].includes(index)?form:'—');r.impersonal=true;r.validPersons=[2,5];r.notes.push('في معنى حدوث الشيء يُستعمل الفعل عادةً مع الغائب المفرد أو الجمع.');
  }
  if(lemma==='ereignen'){
   r.present[2]='ereignet sich';r.present[5]='ereignen sich';r.preterite[2]='ereignete sich';r.preterite[5]='ereigneten sich';r.perfect[2]='hat sich ereignet';r.perfect[5]='haben sich ereignet';r.notes.push('في هذا المعنى الفعل انعكاسي: sich ereignen.');
  }
  if(p?.auxiliary?.length>1)r.notes.push('قد يُستعمل haben أو sein مع هذا الفعل بحسب المعنى؛ يعرض الجدول هنا الاستعمال الأول في المصدر.');
  if(['wollen','sollen','müssen','können','dürfen','mögen'].includes(lemma))r.notes.push('مع فعلٍ آخر قد يُستعمل المصدر البديل في الماضي المركّب؛ يعرض الجدول الصيغة المستقلة للفعل.');
  memo.set(lemma,r);building.delete(lemma);return r;
 }
 building.delete(lemma);return null;
}
// Curated suppletive paradigms and current orthography for auxiliary/modal verbs.
const irregular={
 'haben':{present:['habe','hast','hat','haben','habt','haben'],preterite:['hatte','hattest','hatte','hatten','hattet','hatten'],pastParticiple:'gehabt'},
 'werden':{present:['werde','wirst','wird','werden','werdet','werden'],preterite:['wurde','wurdest','wurde','wurden','wurdet','wurden'],pastParticiple:'geworden'},
 'müssen':{present:['muss','musst','muss','müssen','müsst','müssen'],preterite:['musste','musstest','musste','mussten','musstet','mussten'],pastParticiple:'gemusst'},
 'wissen':{present:['weiß','weißt','weiß','wissen','wisst','wissen'],preterite:['wusste','wusstest','wusste','wussten','wusstet','wussten'],pastParticiple:'gewusst'}
};
const reverse=new Map();
function put(form,lemma){const n=aliasNorm(form);if(!n)return;if(!reverse.has(n))reverse.set(n,[]);if(!reverse.get(n).includes(lemma))reverse.get(n).push(lemma)}
for(const lemma of [...new Set([...Object.keys(dict),...Object.keys(principals),'haben','sein','werden'])]){
 let r=makeRecord(lemma,false);if(!r)continue;if(irregular[lemma]){Object.assign(r,irregular[lemma]);r.perfect=plainAux[r.auxiliary].map(s=>s+' '+r.pastParticiple);}
 for(const form of [...r.present,...r.preterite,r.pastParticiple]){put(form,lemma);if(r.separablePrefix){const [finite]=finiteAndTail(form);put(r.separablePrefix+finite,lemma)}}
 try{for(const [person,number]of persons)put(lib.getConjugation(dict,lemma,'KONJUNKTIV2_PRATERITUM',person,number).join(' '),lemma)}catch{}
 const imp=dict[lemma]?.IMP;if(imp)for(const x of Object.values(imp)){const form=parts(x).join(' ');put(form,lemma);const [finite,tail]=finiteAndTail(form);if(finite.endsWith('e')&&!lemma.endsWith('eln'))put(finite.slice(0,-1)+(tail?' '+tail:''),lemma)}
 for(const form of [...(principals[lemma]?.imperative||[]),...(principals[lemma]?.past||[]),...(principals[lemma]?.participle||[])])put(form,lemma);
}
const customAliases={wär:'sein',hab:'haben',seh:'sehen',nehm:'nehmen',geb:'geben',kenn:'kennen',brauch:'brauchen',tu:'tun',kenntest:'kennen',möchten:'mögen',kennenzulernen:'kennenlernen',wiederzusehen:'wiedersehen',reingekommen:'reinkommen',weisst:'wissen',möge:'mögen',bräuchte:'brauchen',bräuchten:'brauchen',blake:'blaken',les:'lesen',helf:'helfen',hing:'hängen',erschrak:'erschrecken',angerast:'anrasen',wufft:'wuffen',rausgeworfen:'rauswerfen',rausgeschmissen:'rausschmeißen',reingezogen:'reinziehen'};
for(const [form,lemma]of Object.entries(customAliases))put(form,lemma);
const previousRepairFile=path.join(root,'tools/verb-card-repairs.json');const repairs={...(fs.existsSync(previousRepairFile)?JSON.parse(fs.readFileSync(previousRepairFile)):{}),...posRepairs};for(const w of words){if(w.pos==='verb'&&!repairs[w.id]&&w.german[0]!==w.german[0].toLowerCase())repairs[w.id]={german:w.german.toLowerCase()};}
for(const w of words){if(w.german==='unternehmen')repairs[w.id]={...(repairs[w.id]||{}),arabic:'يشرع؛ يقوم بعمل',examples:[{de:'Wir unternehmen am Wochenende einen Ausflug.',ar:'نقوم برحلة في عطلة نهاية الأسبوع.'}]};if(w.german==='schoss')repairs[w.id]={...(repairs[w.id]||{}),arabic:'أطلق النار؛ ماضٍ من schießen'};}
for(const w of words){
 if(w.german==='out')repairs[w.id]={pos:'adjective',article:'',arabic:'خارج الموضة؛ قديم في الاستعمال الدارج',removeVerbForms:true};
 if(w.german==='autofahren'||w.german==='Auto fahren')repairs[w.id]={german:'Auto fahren',lemma:'Auto fahren',note:'المصدر القياسي يُكتب كلمتين: Auto fahren.',examples:[{de:'Ich kann schon Auto fahren.',ar:'أستطيع قيادة السيارة بالفعل.'}]};
 if(w.german==='les')repairs[w.id]={...(repairs[w.id]||{}),arabic:'أقرأ؛ صيغة محكية من lese',note:'في الكتابة القياسية: ich lese. أمر الفعل هو: lies!'};
 if(w.german==='helf')repairs[w.id]={...(repairs[w.id]||{}),arabic:'أساعد؛ صيغة محكية من helfe',note:'في الكتابة القياسية: ich helfe. أمر الفعل هو: hilf!'};
}
const records={},aliases={},byId={},missing=[];
for(const original of words){const patch=repairs[original.id]||{};const w={...original,...patch};if(w.pos!=='verb')continue;let key=norm(w.german).replace(/^sich\s+/,'');if(key==='auto fahren')key='autofahren';let r=makeRecord(key);
 if(!r){const candidates=reverse.get(aliasNorm(key))||[];for(const candidate of candidates){r=makeRecord(candidate);if(r){key=candidate;break}}}
 if(!r){const base=norm(w.lemma||'');if(base!==key)r=makeRecord(base);if(r)key=base;}
 if(!r){missing.push(w);continue;}
 if(['hing','gehangen'].includes(norm(w.german))){r={...r,infinitive:'hängen',preterite:sixPast('hing'),pastParticiple:'gehangen',auxiliary:'haben',perfect:plainAux.haben.map(x=>x+' gehangen'),notes:['هذا هو الاستعمال غير المتعدّي: كان معلّقًا. الفعل المتعدّي له hängte / gehängt.']};key='hängen#intransitive';}
 if(['erschrak','erschrocken'].includes(norm(w.german))){r={...r,infinitive:'erschrecken',preterite:sixPast('erschrak'),pastParticiple:'erschrocken',auxiliary:'sein',perfect:plainAux.sein.map(x=>x+' erschrocken'),notes:['هذا هو الاستعمال غير المتعدّي: فزع. الفعل المتعدّي بمعنى أخاف له erschreckte / erschreckt.']};key='erschrecken#intransitive';}
 records[key]=r;aliases[norm(original.german)]=key;aliases[norm(w.german)]=key;byId[String(w.id)]=key;
}
fs.writeFileSync(path.join(root,'data-sources/verb-card-repairs.json'),JSON.stringify(repairs,null,2));
fs.writeFileSync(path.join(root,'data-sources/verb-conjugation-remaining.json'),JSON.stringify(missing,null,2));
fs.writeFileSync(path.join(root,'dist/data/verbs.json'),JSON.stringify({version:1,pronouns,verbs:records,aliases,byId,coverage:{verbCards:Object.keys(byId).length,missing:missing.length,lemmas:Object.keys(records).length},sources:[{name:'RosaeNLG / LanguageTool German POS dictionary',url:'https://github.com/RosaeNLG/rosaenlg',license:'CC BY-SA 4.0 linguistic data; Apache-2.0 code'},{name:'German Wiktionary principal parts via WortUniversum',url:'https://huggingface.co/datasets/cstr/grundwortschatz-voc-de',license:'GPL-3.0 / Wiktionary CC BY-SA 4.0'}]},null,0));
console.log('covered',Object.keys(byId).length,'lemmas',Object.keys(records).length,'missing',missing.length);console.log(missing.map(w=>w.german));
