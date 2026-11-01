/* Course selection is applied through one reload, keeping all course state isolated. */
(function(global){
 'use strict';
 const course=global.WORT_COURSE,i18n=global.WORT_I18N;
 if(!course||!i18n)return;
 const $=selector=>document.querySelector(selector),t=i18n.t;
 const dialog=$('#course-dialog'),nativeSelect=$('#native-language'),targetSelect=$('#target-language'),applyButton=$('#course-apply'),error=$('#course-error');
 if(!dialog||!nativeSelect||!targetSelect)return;
 const codes=['ar','en','nl','de'];
 const metadata=code=>course.languages[code]||{endonym:code};
 function optionName(code){const local=i18n.languageName(code),endonym=metadata(code).endonym||metadata(code).name||code;return local===endonym?local:local+' · '+endonym;}
 function renderOptions(select,value,disabledCode){
  select.replaceChildren(...codes.map(code=>{const option=document.createElement('option');option.value=code;option.textContent=optionName(code);option.disabled=code===disabledCode;option.selected=code===value;return option;}));
 }
 function renderPair(node,native,target){
  if(!node)return;
  const source=document.createElement('bdi'),arrow=document.createElement('span'),destination=document.createElement('bdi');
  source.textContent=i18n.languageName(native);destination.textContent=i18n.languageName(target);arrow.textContent=course.dir(course.native)==='rtl'?'←':'→';arrow.setAttribute('aria-hidden','true');
  node.replaceChildren(source,arrow,destination);
 }
 function validate(){
  const valid=codes.includes(nativeSelect.value)&&codes.includes(targetSelect.value)&&nativeSelect.value!==targetSelect.value;
  applyButton.disabled=!valid;
  error.textContent=valid?'':t('اختر لغتين مختلفتين.');
  renderPair($('#course-preview'),nativeSelect.value,targetSelect.value);
  return valid;
 }
 function refreshDraft(previousNative){
  let target=targetSelect.value||course.target;
  if(target===nativeSelect.value)target=codes.includes(previousNative)&&previousNative!==nativeSelect.value?previousNative:codes.find(code=>code!==nativeSelect.value);
  renderOptions(targetSelect,target,nativeSelect.value);validate();
 }
 function open(){
  error.textContent='';draftNative=course.native;renderOptions(nativeSelect,course.native);renderOptions(targetSelect,course.target,course.native);validate();
  applyButton.textContent=t(course.hasSelection?'تطبيق المنهاج':'ابدأ التعلّم');
  if(!dialog.open)dialog.showModal();nativeSelect.focus({preventScroll:true});
 }
 let draftNative=course.native;
 nativeSelect.addEventListener('change',()=>{refreshDraft(draftNative);draftNative=nativeSelect.value;});
 targetSelect.addEventListener('change',validate);
 $('#course-swap').addEventListener('click',()=>{
  const native=nativeSelect.value,target=targetSelect.value;
  renderOptions(nativeSelect,target);renderOptions(targetSelect,native,target);draftNative=target;validate();
 });
 $('#course-open').addEventListener('click',open);
 $('#course-close').addEventListener('click',()=>dialog.close());
 $('#course-form').addEventListener('submit',event=>{
  event.preventDefault();if(!validate())return;
  try{course.select({native:nativeSelect.value,target:targetSelect.value});applyButton.disabled=true;location.reload();}
  catch(cause){error.textContent=t(cause?.code==='invalid-course'?'اختر لغتين مختلفتين.':'تعذّر حفظ اختيار اللغة. حاول مجددًا.');applyButton.disabled=false;}
 });
 i18n.apply(document);
 renderPair($('#course-current'),course.native,course.target);
 document.title=t('Wort — {language} من A1 إلى C1',{language:i18n.languageName(course.target)});
 $('#course-open').setAttribute('aria-label',t('اختيار المنهاج')+': '+i18n.languageName(course.native)+' / '+i18n.languageName(course.target));
 document.documentElement.dataset.targetDirection=course.dir(course.target);
 document.documentElement.dataset.nativeDirection=course.dir(course.native);
 if(!course.hasSelection)open();
 global.WORT_COURSE_UI=Object.freeze({open});
})(window);
