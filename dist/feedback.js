/* Noticeable tap and keyboard feedback without replacing semantic selected states. */
(function(){
 'use strict';
 const timers=new WeakMap(),held=new Set();
 const buttonFor=event=>event.target?.closest?.('button:not(:disabled)');
 function press(button){if(!button)return;clearTimeout(timers.get(button));button.classList.add('is-pressed');held.add(button);}
 function release(button){if(!button)return;held.delete(button);clearTimeout(timers.get(button));timers.set(button,setTimeout(()=>button.classList.remove('is-pressed'),170));}
 document.addEventListener('pointerdown',event=>press(buttonFor(event)),true);
 document.addEventListener('pointerup',()=>{for(const button of [...held])release(button);},true);
 document.addEventListener('pointercancel',()=>{for(const button of [...held])release(button);},true);
 document.addEventListener('keydown',event=>{if(!event.repeat&&['Enter',' '].includes(event.key))press(buttonFor(event));},true);
 document.addEventListener('keyup',event=>{if(['Enter',' '].includes(event.key))for(const button of [...held])release(button);},true);
 document.addEventListener('click',event=>{const button=buttonFor(event);press(button);release(button);},true);
 window.addEventListener('blur',()=>{for(const button of [...held])release(button);});
})();
