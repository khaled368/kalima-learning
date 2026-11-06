(function(){
  'use strict';
  const {LevelUpCelebration,DEFAULT_RANKS}=window.KalimaLevelUp;
  const select=document.getElementById('select-rank');
  const button=document.getElementById('start-preview');
  DEFAULT_RANKS.forEach((rank,index)=>{
    const option=document.createElement('option');
    option.value=String(index);option.textContent=`${rank.id} — ${rank.name} (${rank.threshold.toLocaleString('en-US')} كلمة)`;
    if(index===3)option.selected=true;
    select.appendChild(option);
  });
  const celebration=new LevelUpCelebration('#celebration');
  button.addEventListener('click',async()=>{
    button.disabled=true;
    try{await celebration.play(Number(select.value));}
    finally{button.disabled=false;button.textContent='↻ إعادة عرض الاحتفال';}
  });
})();