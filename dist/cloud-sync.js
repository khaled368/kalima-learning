/* Private account snapshots. Legacy app keys and JSON value types stay intact. */
(function(global){
 'use strict';
 const PREFIX='wort-cloud-v1:', OWNER=PREFIX+'owner', PENDING=PREFIX+'pending', ANON='anonymous';
 const suffix='(?::(?:en|nl|ar))?';
 const patterns=[new RegExp('^wort-(?:learned|saved|today)'+suffix+'$'),new RegExp('^wort-learning-history-v1'+suffix+'$'),new RegExp('^wort-sentences-v1'+suffix+'$'),new RegExp('^wort-writing-level'+suffix+'$'),new RegExp('^wort-analytics-preferences'+suffix+'$'),/^wort-writing-v1:[a-zA-Z0-9_.:-]+$/,/^wort-assessment-v1(?::(?:ar|en|nl|de):(?:ar|en|nl|de))?$/,/^wort-(?:usage-v1|course-selection|card-view)$/];
 const allowed=key=>typeof key==='string'&&patterns.some(pattern=>pattern.test(key));
 const object=()=>Object.create(null);
 const parse=(value,fallback=null)=>{try{return JSON.parse(value)??fallback;}catch{return fallback;}};
 const copy=value=>value==null?value:JSON.parse(JSON.stringify(value));
 const ids=value=>Array.isArray(value)?value.filter(id=>typeof id==='string'||typeof id==='number'&&Number.isFinite(id)):[];
 const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
 const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
 function union(...arrays){const values=new Map();for(const array of arrays)for(const id of ids(array)){const k=String(id);if(!values.has(k)||typeof id==='number')values.set(k,id);}return [...values].sort(([a],[b])=>a.localeCompare(b)).map(([,id])=>id);}
 function day(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const [y,m,d]=value.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d));return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d;}
 const type=key=>/^wort-learned(?::|$)/.test(key)?'learned':/^wort-saved(?::|$)/.test(key)?'saved':/^wort-learning-history-v1(?::|$)/.test(key)?'history':/^wort-sentences-v1(?::|$)/.test(key)?'sentences':key==='wort-usage-v1'?'usage':/^wort-today(?::|$)/.test(key)?'today':key.startsWith('wort-writing-v1:')?'draft':'scalar';
 function stamp(value={}){const n=Number.isSafeInteger(value.n)&&value.n>=0?value.n:0,actor=typeof value.actor==='string'?value.actor:'import',vector=object();for(const [k,v] of Object.entries(value.vector||{}))if(Number.isSafeInteger(v)&&v>=0)vector[k]=v;if(!Object.keys(vector).length)vector[actor]=n;return {n,actor,vector,...(value.deleted?{deleted:true}:{})};}
 function compare(a,b){a=stamp(a);b=stamp(b);return a.n-b.n||a.actor.localeCompare(b.actor);}
 function vectors(a,b){const out=object();for(const value of [a||{},b||{}])for(const [k,n] of Object.entries(value))out[k]=Math.max(out[k]||0,n);return out;}
 function dominates(a,b){const keys=new Set([...Object.keys(a||{}),...Object.keys(b||{})]);return [...keys].every(k=>(a?.[k]||0)>=(b?.[k]||0))&&[...keys].some(k=>(a?.[k]||0)>(b?.[k]||0));}
 function normalize(input,owner){
  if(input?.owner&&input.owner!==owner)throw new Error('Cloud snapshot owner mismatch.');
  const p={version:1,owner,clock:Math.max(0,Number.isSafeInteger(input?.clock)?input.clock:0),values:object(),stamps:object(),saved:object(),conflicts:[]};
  for(const [key,value] of Object.entries(input?.values||{}))if(allowed(key)&&typeof value==='string')p.values[key]=value;
  for(const [key,value] of Object.entries(input?.stamps||{}))if(allowed(key)){p.stamps[key]=stamp(value);p.clock=Math.max(p.clock,p.stamps[key].n);}
  for(const [key,items] of Object.entries(input?.saved||{}))if(allowed(key)&&type(key)==='saved'){const out=p.saved[key]=object();for(const [k,item] of Object.entries(items||{}))if(item&&['number','string'].includes(typeof item.id)&&String(item.id)===k&&typeof item.present==='boolean'){out[k]={id:item.id,present:item.present,stamp:stamp(item.stamp)};p.clock=Math.max(p.clock,out[k].stamp.n);}}
  for(const item of Array.isArray(input?.conflicts)?input.conflicts:[])if(allowed(item?.key)&&type(item.key)==='draft'&&typeof item.value==='string')p.conflicts.push({key:item.key,value:item.value,stamp:stamp(item.stamp)});
  return p;
 }
 function fromRaw(raw,owner,actor='import'){
  const p=normalize(null,owner);for(const [key,value] of Object.entries(raw||{}))if(allowed(key)&&typeof value==='string'){p.values[key]=value;p.stamps[key]={n:1,actor,vector:{[actor]:1}};p.clock=1;if(type(key)==='saved'){p.saved[key]=object();for(const id of union(ids(parse(value,[]))))p.saved[key][String(id)]={id,present:true,stamp:copy(p.stamps[key])};}}return p;
 }
 function history(a,b){
  const rows=new Map(),undated=union(a?.undatedIds,b?.undatedIds),started=[a?.startedAt,b?.startedAt].filter(day).sort();
  for(const source of [a,b])for(const event of Array.isArray(source?.events)?source.events:[]){if(!event||!['string','number'].includes(typeof event.id)||!day(event.day)||!['A1','A2','B1','B2','C1'].includes(event.level))continue;const key=String(event.id),old=rows.get(key);if(!old||event.day<old.day||event.day===old.day&&(String(event.at||'~')<String(old.at||'~')||String(event.at||'~')===String(old.at||'~')&&(typeof event.id==='number'&&typeof old.id!=='number'||typeof event.id===typeof old.id&&event.level<old.level)))rows.set(key,{id:event.id,day:event.day,level:event.level,...(typeof event.at==='string'?{at:event.at}:{})});}
  return {version:1,...(started.length?{startedAt:started[0]}:{}),events:[...rows.values()].sort((a,b)=>a.day.localeCompare(b.day)||String(a.id).localeCompare(String(b.id))),undatedIds:undated.filter(id=>!rows.has(String(id)))};
 }
 function usage(a,b){
  const out={version:1,days:object(),lastSavedAt:[a?.lastSavedAt,b?.lastSavedAt].filter(x=>typeof x==='string').sort().at(-1)||null};const starts=[a?.startedAt,b?.startedAt].filter(day);
  for(const source of [a,b]){const rows=Array.isArray(source?.days)?source.days:Object.entries(source?.days||{}).map(([d,v])=>({day:d,...(typeof v==='number'?{activeMs:v}:v)}));for(const row of rows){if(!day(row?.day))continue;const target=out.days[row.day]||=( {contributions:object()} );const contributions=row.contributions||{legacy:row.activeMs};for(const [id,ms] of Object.entries(contributions))if(typeof ms==='number'&&Number.isFinite(ms)&&ms>0)target.contributions[id]=Math.max(target.contributions[id]||0,ms);}}
  starts.push(...Object.keys(out.days));if(starts.length)out.startedAt=starts.sort()[0];return out;
 }
 function semantic(kind,left,right,winner){
  if(left===right)return left;if(left===undefined)return right;if(right===undefined)return left;const a=parse(left),b=parse(right);
  if(kind==='learned')return JSON.stringify(union(a,b));
  if(kind==='history')return JSON.stringify(history(a,b));
  if(kind==='usage')return JSON.stringify(usage(a,b));
  if(kind==='sentences'){const selected=parse(winner,{})||{};return JSON.stringify({...selected,solved:union(a?.solved,b?.solved)});}
  if(kind==='today'){const dates=[a?.day,b?.day].filter(day).sort(),latest=dates.at(-1);return latest?JSON.stringify({day:latest,ids:union(a?.day===latest?a.ids:[],b?.day===latest?b.ids:[])}):winner;}
  return winner;
 }
 function archive(p,key,value,s){if(typeof value!=='string'||!parse(value,{})?.text)return;const token=key+'\u0000'+value;if(!p.conflicts.some(x=>x.key+'\u0000'+x.value===token))p.conflicts.push({key,value,stamp:stamp(s)});}
 function reconcile(p){
  for(const [key,items] of Object.entries(p.saved))p.values[key]=JSON.stringify(union(Object.values(items).filter(item=>item.present).map(item=>item.id)));
  for(const key of Object.keys(p.values))if(type(key)==='history'){const h=parse(p.values[key]);if(!h)continue;const suffix=key.slice('wort-learning-history-v1'.length),learnedKey='wort-learned'+suffix,learned=union(parse(p.values[learnedKey],[]),h.undatedIds,(h.events||[]).map(e=>e.id)),dated=new Set((h.events||[]).map(e=>String(e.id)));h.undatedIds=learned.filter(id=>!dated.has(String(id)));p.values[learnedKey]=JSON.stringify(learned);p.values[key]=JSON.stringify(h);}
  p.conflicts.sort((a,b)=>a.key.localeCompare(b.key)||a.value.localeCompare(b.value));return p;
 }
 function mergePayload(left,right,owner=left?.owner||right?.owner){
  if(!owner)throw new Error('A snapshot owner is required.');const a=normalize(left,owner),b=normalize(right,owner),out=normalize(null,owner);out.clock=Math.max(a.clock,b.clock);out.conflicts=[...a.conflicts];for(const c of b.conflicts)archive(out,c.key,c.value,c.stamp);
  const keys=new Set([...Object.keys(a.values),...Object.keys(b.values),...Object.keys(a.stamps),...Object.keys(b.stamps),...Object.keys(a.saved),...Object.keys(b.saved)]);
  for(const key of keys){const sa=stamp(a.stamps[key]),sb=stamp(b.stamps[key]),comparison=compare(sa,sb);let chooseA=comparison>0||comparison===0&&String(a.values[key]??'')>=String(b.values[key]??'');const win=chooseA?sa:sb,raw=chooseA?a.values[key]:b.values[key];out.stamps[key]={...win,vector:vectors(sa.vector,sb.vector)};
   const kind=type(key);
   if(kind==='saved'){const all=out.saved[key]=object();for(const source of [a,b]){const incoming=source.saved[key]||Object.fromEntries(union(parse(source.values[key],[])).map(id=>[String(id),{id,present:true,stamp:source.stamps[key]}]));for(const [id,item] of Object.entries(incoming)){const old=all[id],c=old?compare(item.stamp,old.stamp):1;if(!old||c>0||c===0&&(!item.present||old.present===item.present&&typeof item.id==='number'&&typeof old.id!=='number'))all[id]=copy(item);}}continue;}
   if(kind==='draft'&&a.values[key]!==b.values[key]&&!dominates(sa.vector,sb.vector)&&!dominates(sb.vector,sa.vector)){if(chooseA)archive(out,key,b.values[key],sb);else archive(out,key,a.values[key],sa);}
   if(['learned','history','usage','sentences','today'].includes(kind)){const value=semantic(kind,a.values[key],b.values[key],raw);if(value!==undefined)out.values[key]=value;}
   else if(!win.deleted&&raw!==undefined)out.values[key]=raw;
  }
  return reconcile(out);
 }
 function applyChanges(input,before,after,actor,observedStamps={}){
  const p=normalize(input,input.owner),versions=copy(observedStamps)||{};
  for(const key of new Set([...Object.keys(before||{}),...Object.keys(after||{})])){if(!allowed(key)||before?.[key]===after?.[key])continue;const n=++p.clock,base=stamp(versions[key]||(before?.[key]===undefined?{n:0,actor:'empty',vector:{}}:p.stamps[key])),s={n,actor,vector:{...base.vector,[actor]:n},...(after?.[key]===undefined?{deleted:true}:{})},kind=type(key);p.stamps[key]=s;versions[key]=copy(s);
   if(kind==='saved'){const old=new Map(union(parse(before?.[key],[])).map(id=>[String(id),id])),next=new Map(union(parse(after?.[key],[])).map(id=>[String(id),id])),items=p.saved[key]||=(object());for(const id of new Set([...old.keys(),...next.keys()]))if(old.has(id)!==next.has(id))items[id]={id:next.get(id)??old.get(id),present:next.has(id),stamp:copy(s)};}
   else if(['learned','history','usage','sentences','today'].includes(kind)){const value=semantic(kind,p.values[key],after?.[key],after?.[key]);if(value!==undefined)p.values[key]=value;}
   else{if(kind==='draft'&&before?.[key]!==p.values[key])archive(p,key,p.values[key],input.stamps?.[key]);if(after?.[key]===undefined)delete p.values[key];else p.values[key]=after[key];}
  }
  return {payload:reconcile(p),observedStamps:versions};
 }
 function equivalentRaw(a,b){
  const keys=new Set([...Object.keys(a||{}),...Object.keys(b||{})]);
  for(const key of keys){
   if(a?.[key]===b?.[key])continue;if(a?.[key]===undefined||b?.[key]===undefined)return false;
   let left=parse(a[key],a[key]),right=parse(b[key],b[key]);const kind=type(key);
   if(kind==='learned'||kind==='saved'){left=union(left);right=union(right);}
   else if(kind==='history'){left=history(left,left);right=history(right,right);}
   else if(kind==='usage'){left=usage(left,left);right=usage(right,right);}
   else if(kind==='sentences'){left={...left,solved:union(left?.solved)};right={...right,solved:union(right?.solved)};}
   else if(kind==='today'){left={...left,ids:union(left?.ids)};right={...right,ids:union(right?.ids)};}
   if(!same(left,right))return false;
  }
  return true;
 }
 function toRaw(payload){return {...reconcile(normalize(payload,payload.owner)).values};}
 // Runtime banking and Supabase transport are defined below.
 const contexts=new WeakMap();
 const uuid=()=>global.crypto?.randomUUID?.()||'device-'+Math.random().toString(36).slice(2)+'-'+Date.now().toString(36);
 const validOwner=value=>value===ANON||typeof value==='string'&&/^[a-zA-Z0-9_-]{8,128}$/.test(value);
 function methods(storage){const proto=global.Storage?.prototype;return {get:(proto?.__wortNativeGet||storage.getItem).bind(storage),set:(proto?.__wortNativeSet||storage.setItem).bind(storage),remove:(proto?.__wortNativeRemove||storage.removeItem).bind(storage)};}
 function capture(storage){const raw=object();for(let i=0;i<storage.length;i++){const key=storage.key(i);if(allowed(key)){const value=storage.getItem(key);if(typeof value==='string')raw[key]=value;}}return raw;}
 function marker(io){const value=parse(io.get(OWNER));return validOwner(value)?value:ANON;}
 function bankKey(owner){return PREFIX+'bank:'+owner;}
 function readBank(io,owner){
  const stored=parse(io.get(bankKey(owner)));
  if(stored?.version===1&&stored.owner===owner)try{
   const payload=normalize(stored.payload,owner),observed={...(stored.observed||{})};
   for(const key of stored.observedReferences||[])if(allowed(key)&&typeof payload.values[key]==='string')observed[key]=payload.values[key];
   return {version:1,owner,actor:stored.actor||uuid(),revision:Number.isSafeInteger(stored.revision)?stored.revision:0,payload,observed,observedStamps:stored.observedStamps||{}};
  }catch{}
  return {version:1,owner,actor:uuid(),revision:0,payload:normalize(null,owner),observed:{},observedStamps:{}};
 }
 function writeBank(io,bank){
  // Most observed values equal the working snapshot. Store references instead of
  // duplicating complete learning histories, while preserving unseen remote data.
  const observed=object(),observedReferences=[];
  for(const [key,value] of Object.entries(bank.observed||{})){
   if(equivalentRaw({[key]:value},{[key]:bank.payload.values[key]}))observedReferences.push(key);else observed[key]=value;
  }
  io.set(bankKey(bank.owner),JSON.stringify({...bank,observed,observedReferences}));
 }
 function captureBank(storage,io,owner){const bank=readBank(io,owner),raw=capture(storage),changed=applyChanges(bank.payload,bank.observed,raw,bank.actor,bank.observedStamps);bank.payload=changed.payload;bank.observedStamps=changed.observedStamps;bank.observed=raw;writeBank(io,bank);return bank;}
 function install(storage,io,raw){const keys=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(allowed(key))keys.push(key);}for(const key of keys)if(!Object.prototype.hasOwnProperty.call(raw,key))io.remove(key);for(const [key,value] of Object.entries(raw))if(allowed(key))io.set(key,value);}
 function inactiveOwner(ctx){
  const claimed=ctx.owner===ANON?parse(ctx.io.get(PREFIX+'claimed:'+ctx.actor)):null;
  return validOwner(claimed)&&claimed!==ANON?claimed:ctx.owner;
 }
 function inactiveWrite(ctx,key,value){
  const bank=readBank(ctx.io,inactiveOwner(ctx)),before=ctx.observed||{},next={...before};
  if(value===undefined)delete next[key];else next[key]=String(value);
  const changed=applyChanges(bank.payload,before,next,ctx.actor,ctx.observedStamps);
  bank.payload=changed.payload;ctx.observed=next;ctx.observedStamps=changed.observedStamps;writeBank(ctx.io,bank);
 }
 function installGuard(ctx){
  const proto=global.Storage?.prototype;if(!proto||proto.__wortGuarded)return;
  const get=proto.getItem,set=proto.setItem,remove=proto.removeItem;
  Object.defineProperties(proto,{__wortGuarded:{value:true},__wortNativeGet:{value:get},__wortNativeSet:{value:set},__wortNativeRemove:{value:remove}});
  proto.getItem=function(key){const current=contexts.get(this);if(current&&allowed(String(key))&&marker(current.io)!==current.owner){return Object.prototype.hasOwnProperty.call(current.observed||{},key)?current.observed[key]:null;}return get.call(this,key);};
  proto.setItem=function(key,value){const current=contexts.get(this);if(current&&allowed(String(key))&&marker(current.io)!==current.owner){inactiveWrite(current,String(key),value);return;}set.call(this,key,value);if(current&&allowed(String(key))){current.observed[String(key)]=String(value);}if(current&&allowed(String(key)))global.dispatchEvent?.(new global.CustomEvent('wort:local-progress'));};
  proto.removeItem=function(key){const current=contexts.get(this);if(current&&allowed(String(key))&&marker(current.io)!==current.owner){inactiveWrite(current,String(key),undefined);return;}remove.call(this,key);if(current&&allowed(String(key))){delete current.observed[String(key)];}if(current&&allowed(String(key)))global.dispatchEvent?.(new global.CustomEvent('wort:local-progress'));};
 }
 function bootstrap(storage=global.localStorage){
  if(!storage)return {owner:ANON,available:false};if(contexts.has(storage))return contexts.get(storage);
  const io=methods(storage),from=marker(io),ctx={storage,io,owner:from,available:true};contexts.set(storage,ctx);
  const pending=parse(io.get(PENDING));
  if(validOwner(pending?.owner)){
   const old=captureBank(storage,io,from),next=readBank(io,pending.owner);
   if(from===ANON&&pending.owner!==ANON&&pending.importAnonymous){next.payload=mergePayload(next.payload,{...old.payload,owner:pending.owner},pending.owner);writeBank(io,next);io.set(PREFIX+'claimed:'+old.actor,JSON.stringify(pending.owner));const fresh=readBank({get:()=>null},ANON);writeBank(io,fresh);}
   const raw=toRaw(next.payload);next.observed=raw;next.observedStamps=copy(next.payload.stamps);writeBank(io,next);
   // Ownership changes before app keys, so older tabs route late writes to their own bank.
   ctx.owner=pending.owner;io.set(OWNER,JSON.stringify(ctx.owner));install(storage,io,raw);io.remove(PENDING);
  }else{
   const stored=readBank(io,from),raw=capture(storage);
   if(!io.get(bankKey(from))){stored.payload=fromRaw(raw,from,stored.actor);stored.observed=raw;stored.observedStamps=copy(stored.payload.stamps);writeBank(io,stored);}
   else{const update=applyChanges(stored.payload,stored.observed,raw,stored.actor,stored.observedStamps);stored.payload=update.payload;const merged=toRaw(stored.payload);stored.observed=merged;stored.observedStamps=copy(stored.payload.stamps);writeBank(io,stored);install(storage,io,merged);}
   io.set(OWNER,JSON.stringify(from));
  }
  const activeBank=readBank(io,ctx.owner);ctx.actor=activeBank.actor;ctx.observed=capture(storage);ctx.observedStamps=copy(activeBank.payload.stamps);
  installGuard(ctx);
  if(global.addEventListener){global.addEventListener('storage',event=>{if((event.key===OWNER||allowed(event.key))&&marker(io)!==ctx.owner){event.stopImmediatePropagation?.();try{global.WORT_USAGE?.stop?.();global.cancelWordAdvance?.();}catch{}if(!ctx.reloading){ctx.reloading=true;global.location?.reload?.();}}},true);}
  return ctx;
 }
 function create(options={}){
  const client=options.client||global.WORT_SUPABASE,storage=options.storage||global.localStorage;
  if(!client?.from||!client?.rpc)throw new Error('A configured Supabase client is required.');
  const ctx=bootstrap(storage),io=ctx.io,listeners=new Set();let owner=ctx.owner,bank=readBank(io,owner),generation=0,started=false,poll=null,debounce=null,busy=null,dirty=false,firstActivation=true;
  let status={state:'local',userId:owner===ANON?null:owner,revision:bank.revision,needsReload:false,conflictCount:bank.payload.conflicts.length,error:null};
  function emit(patch={}){status={...status,...patch,userId:owner===ANON?null:owner,revision:bank.revision,conflictCount:bank.payload.conflicts.length};for(const fn of listeners)try{fn({...status});}catch{}global.dispatchEvent?.(new global.CustomEvent('wort:sync-status',{detail:{...status}}));}
  function save(){writeBank(io,bank);}
  function collect(){
   if(marker(io)!==owner)return false;
   // Other tabs can have banked a remote response since our last collection.
   const stored=readBank(io,owner);bank.payload=mergePayload(bank.payload,stored.payload,owner);bank.revision=Math.max(bank.revision,stored.revision);
   const raw=capture(storage);if(equivalentRaw(raw,bank.observed))return false;
   const result=applyChanges(bank.payload,bank.observed,raw,bank.actor,bank.observedStamps);
   bank.payload=result.payload;bank.observed=raw;bank.observedStamps=result.observedStamps;dirty=true;save();return true;
  }
  function still(run,uid){return run===generation&&owner===uid&&marker(io)===ctx.owner;}
  async function sync(){
   if(owner===ANON){collect();emit({state:'local',error:null});return {...status};}
   if(busy)return busy;
   const run=generation,uid=owner;
   const operation=(async()=>{
    try{
     collect();emit({state:'syncing',error:null});
     const read=await client.from('progress_snapshots').select('revision,payload').eq('user_id',uid).maybeSingle();
     if(read.error)throw read.error;if(!still(run,uid))return {...status};
     let remote=read.data?.payload||null,revision=Number(read.data?.revision)||0;
     for(let attempt=0;attempt<4;attempt++){
      collect();bank.payload=mergePayload(bank.payload,remote,uid);bank.revision=revision;save();if(!still(run,uid))return {...status};
      const submitted=copy(bank.payload);
      const result=await client.rpc('save_progress_snapshot',{expected_revision:revision,next_payload:submitted});
      if(result.error)throw result.error;if(!still(run,uid))return {...status};
      const answer=Array.isArray(result.data)?result.data[0]:result.data;
      if(!answer||typeof answer.ok!=='boolean')throw new Error('The synchronization response was invalid.');
      revision=Number(answer.revision)||0;remote=answer.payload||null;
      if(answer.ok){
       collect();bank.payload=mergePayload(bank.payload,remote,uid);bank.revision=revision;
       dirty=!same(bank.payload,mergePayload(submitted,remote,uid));save();
       emit({state:'synced',error:null,needsReload:!equivalentRaw(toRaw(bank.payload),capture(storage))});return {...status};
      }
     }
     throw new Error('Progress changed on another device. Please sync again.');
    }catch(error){
     if(still(run,uid)){try{collect();save();}catch{}dirty=true;emit({state:'offline',error:String(error?.message||error)});}
     return {...status};
    }
   })();
   busy=operation;
   try{return await operation;}finally{if(busy===operation)busy=null;}
  }
  async function activate(user){
   const next=user?.id||ANON;if(!validOwner(next))throw new Error('A valid authenticated user is required.');
   generation++;busy=null;stop();try{global.WORT_USAGE?.stop?.();global.cancelWordAdvance?.();}catch{}
   collect();save();
   if(next!==owner){
    const nextBank=readBank(io,next);
    if(owner===ANON&&next!==ANON)nextBank.payload=mergePayload(nextBank.payload,{...bank.payload,owner:next},next);
    const from=owner;owner=next;bank=nextBank;save();
    // Remote work is bank-only until a clean reload initializes all legacy modules.
    if(next!==ANON)await sync();
    io.set(PENDING,JSON.stringify({owner:next,importAnonymous:from===ANON&&next!==ANON}));
    emit({needsReload:true});firstActivation=false;return {requiresReload:true,state:status.state};
   }
   if(next!==ANON)await sync();else emit({state:'local',error:null});
   const needs=firstActivation&&!equivalentRaw(toRaw(bank.payload),capture(storage));firstActivation=false;
   if(needs){io.set(PENDING,JSON.stringify({owner,importAnonymous:false}));emit({needsReload:true});}
   return {requiresReload:needs,state:status.state};
  }
  function schedule(){if(!started)return;clearTimeout(debounce);debounce=global.setTimeout?.(()=>{try{const changed=collect();if((changed||dirty)&&owner!==ANON)sync();}catch(error){emit({state:'error',error:String(error.message||error)});}},500);}
  function start(){if(started)return api;started=true;global.addEventListener?.('wort:local-progress',schedule);global.addEventListener?.('online',sync);global.addEventListener?.('pagehide',flushLocal);poll=global.setInterval?.(()=>{try{const changed=collect();if((changed||dirty)&&owner!==ANON)sync();}catch(error){emit({state:'error',error:String(error.message||error)});}},2500);return api;}
  function flushLocal(){try{collect();save();}catch{}}
  function stop(){started=false;if(poll!=null)global.clearInterval?.(poll);if(debounce!=null)global.clearTimeout?.(debounce);poll=null;debounce=null;global.removeEventListener?.('wort:local-progress',schedule);global.removeEventListener?.('online',sync);global.removeEventListener?.('pagehide',flushLocal);flushLocal();}
  async function flush(){collect();const result=await sync();if(result.state==='offline'||result.state==='error'){const error=new Error(result.error||'Progress is saved locally and will sync later.');error.code='sync-offline';throw error;}return result;}
  const api={activate,start,stop,flush,sync,subscribe(fn){listeners.add(fn);fn({...status});return()=>listeners.delete(fn);},snapshot(){return {...status};},conflicts(){return copy(bank.payload.conflicts);}};return api;
 }
 const api=Object.freeze({create,bootstrap,mergePayload,fromRaw,toRaw,applyChanges,allowed,capture,version:1});
 global.WORT_CLOUD_SYNC=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
 try{if(global.document&&global.localStorage)bootstrap(global.localStorage);}catch(error){global.WORT_CLOUD_BOOT_ERROR=String(error.message||error);}
})(typeof window==='object'?window:globalThis);
