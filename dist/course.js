/* Course selection is read before progress, lessons, or audio are initialized. */
(function(global){
 'use strict';
 const selectionKey='wort-course-selection';
 const languages=Object.freeze({
  ar:Object.freeze({code:'ar',name:'العربية',endonym:'العربية',dir:'rtl',voice:'ar-SA'}),
  en:Object.freeze({code:'en',name:'English',endonym:'English',dir:'ltr',voice:'en-US'}),
  nl:Object.freeze({code:'nl',name:'Nederlands',endonym:'Nederlands',dir:'ltr',voice:'nl-NL'}),
  de:Object.freeze({code:'de',name:'Deutsch',endonym:'Deutsch',dir:'ltr',voice:'de-DE'})
 });
 const valid=pair=>Boolean(pair&&Object.prototype.hasOwnProperty.call(languages,pair.native)&&Object.prototype.hasOwnProperty.call(languages,pair.target)&&pair.native!==pair.target);
 let stored=null;
 try{stored=JSON.parse(global.localStorage?.getItem(selectionKey)||'null');}catch{}
 const hasSelection=valid(stored);
 const selection=Object.freeze(hasSelection?{native:stored.native,target:stored.target}:{native:'ar',target:'de'});
 const {native,target}=selection;
 function dir(code=native){return languages[String(code).toLowerCase().split('-')[0]]?.dir||'ltr';}
 // Knowledge follows the language being learned, independently of explanation language.
 function key(base){return target==='de'?String(base):`${base}:${target}`;}
 // Recognition results also depend on the language used for answer choices.
 function pairKey(base){return native==='ar'&&target==='de'?String(base):`${base}:${native}:${target}`;}
 function select(pair){
  if(!valid(pair)){const error=new RangeError('Choose two different supported languages.');error.code='invalid-course';throw error;}
  const next={native:pair.native,target:pair.target};
  try{if(!global.localStorage)throw new Error('Storage is unavailable.');global.localStorage.setItem(selectionKey,JSON.stringify(next));}
  catch(cause){const error=new Error('The course selection could not be saved.');error.code='course-storage-unavailable';error.cause=cause;throw error;}
  return next;
 }
 const document=global.document;
 if(document?.documentElement){document.documentElement.lang=native;document.documentElement.dir=dir(native);document.documentElement.dataset.nativeLanguage=native;document.documentElement.dataset.targetLanguage=target;}
 global.WORT_COURSE=Object.freeze({native,target,locale:native,languages,selectionKey,hasSelection,configured:hasSelection,dir,key,pairKey,select,valid});
})(globalThis);
