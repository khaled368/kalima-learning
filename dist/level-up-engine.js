/* Kalima Level-Up Kit: standalone, dependency-free, 10 original shields.
   Portable configuration: set ranks, sprite URL and user-supplied sound URLs. */
(function(global){
  'use strict';
  const DEFAULT_RANKS=Object.freeze([
    {id:1,name:'برونزي',threshold:100},
    {id:2,name:'فضي',threshold:250},
    {id:3,name:'ذهبي',threshold:500},
    {id:4,name:'نجمي',threshold:1000},
    {id:5,name:'ماسي',threshold:2000},
    {id:6,name:'ملكي',threshold:3500},
    {id:7,name:'إمبراطوري',threshold:5000},
    {id:8,name:'كريستالي',threshold:6500},
    {id:9,name:'أسطوري',threshold:8000},
    {id:10,name:'خالد',threshold:10000}
  ]);
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const ease=t=>1-Math.pow(1-clamp(t,0,1),3);
  class LevelUpCelebration{
    constructor(root, options={}){
      this.root=typeof root==='string'?global.document.querySelector(root):root;
      if(!this.root)throw new Error('Level-up container not found');
      this.ranks=options.ranks||DEFAULT_RANKS;
      this.soundEnabled=options.soundEnabled!==false;
      this.duration=options.progressSeconds||4.15;
      this.progressSound=options.progressSound||'assets/progress.mp3';
      this.celebrationSound=options.celebrationSound||'assets/celebration.mp3';
      this.sprite=options.sprite||'assets/kalima-shields.png';
      // Intro of the three-part celebration music is skipped; progress SFX stays intact.
      this.celebrationStartFraction=clamp(Number(options.celebrationStartFraction??(1/3)),0,.9);
      this.onFinish=options.onFinish||(()=>{});
      this.counter=this.root.querySelector('#score-number');
      this.fill=this.root.querySelector('#progress-fill');
      this.track=this.root.querySelector('#progress-track');
      this.shield=this.root.querySelector('#shield');
      this.previousShield=this.root.querySelector('#previous-shield');
      this.fragments=this.root.querySelector('#shield-fragments');
      this.shards=Array.from(this.root.querySelectorAll?.('.shield-shard')||[]);
      this.hint=this.root.querySelector('#score-hint');
      this.name=this.root.querySelector('#rank-name');
      this.subtitle=this.root.querySelector('#rank-subtitle');
      this.shield.style.backgroundImage='url('+JSON.stringify(this.sprite)+')';
      this.ctx=null;this.sources=[];this.raf=0;this.active=false;this.revealed=false;
      this.audioClock=null;this.runId=0;this.transitionSeconds=1.25;
      this.revealDelay=.36;this.reducedMotion=false;this.evolving=false;
      this._assemblyStarts=[[-135,-115,-34],[-30,-155,26],[48,-153,-26],[140,-115,34],[-139,118,31],[-39,157,-29],[48,153,29],[143,116,-31]];
      this._makeParticles();
    }
    _makeParticles(){
      const host=this.root.querySelector('.particles');
      if(!host||host.childElementCount)return;
      for(let i=0;i<24;i++){
        const p=global.document.createElement('i');p.className='particle';
        const a=i*Math.PI*2/24;
        p.style.cssText='--dx:'+Math.round(Math.cos(a)*(115+i%5*19))+'px;--dy:'+Math.round(Math.sin(a)*(95+i%3*24))+'px;--d:'+(i%5*44)+'ms';
        host.appendChild(p);
      }
    }
    _assemble(progress){
      const n=this.shards.length;
      if(!n)return;
      // Each piece locks into place during its own eighth of the 0-100% bar.
      for(let i=0;i<n;i++){
        const k=ease(clamp(progress*n-i,0,1));
        const [dx,dy,angle]=this._assemblyStarts[i]||[0,-100,0];
        const shard=this.shards[i];
        shard.style.opacity=String(k);
        shard.style.transform='translate3d('+(dx*(1-k)).toFixed(1)+'px,'+
          (dy*(1-k)).toFixed(1)+'px,0) rotate('+(angle*(1-k)).toFixed(1)+
          'deg) scale('+(.64+.36*k).toFixed(4)+')';
      }
    }
    _stop(){
      this.active=false;this.runId++;global.cancelAnimationFrame?.(this.raf);
      for(const node of this.sources)try{node.stop()}catch{}
      this.sources=[];
    }
    async _prepareAudio(){
      if(!this.soundEnabled)return null;
      const Ctx=global.AudioContext||global.webkitAudioContext;
      if(!Ctx)return null;
      this.ctx=this.ctx||new Ctx();
      // Called by a user click: unlock Safari/Chrome playback before awaits.
      const resumed=this.ctx.resume().catch(()=>null);
      const buffer=async url=>{
        try{const res=await global.fetch(url);if(!res.ok)throw new Error('audio HTTP '+res.status);
          return await this.ctx.decodeAudioData(await res.arrayBuffer());
        }catch{return null;}
      };
      const [progress,celebration]=await Promise.all([buffer(this.progressSound),buffer(this.celebrationSound),resumed]);
      return {progress,celebration};
    }
    _scheduleAudio(buffers){
      if(!buffers||!this.ctx){
        this.audioEnd=this.duration+this.revealDelay+7.8;return;
      }
      const now=this.ctx.currentTime+.08;
      this.audioClock=now;
      const start=(buffer,when,limit=null,offset=0)=>{
        if(!buffer||!Number.isFinite(buffer.duration)||buffer.duration<=offset)return;
        const source=this.ctx.createBufferSource();
        source.buffer=buffer;
        const gain=this.ctx.createGain();
        gain.gain.value=.85;
        source.connect(gain);gain.connect(this.ctx.destination);
        // Starting at an offset drops section one of the three-part music,
        // without changing the original file or the progress-bar sound.
        source.start(when,offset);
        if(limit!==null)source.stop(when+Math.min(limit,buffer.duration-offset));
        this.sources.push(source);
      };
      start(buffers.progress,now,this.duration);
      const celebrationOffset=buffers.celebration
        ?buffers.celebration.duration*this.celebrationStartFraction:0;
      start(buffers.celebration,now+this.duration+this.revealDelay,null,celebrationOffset);
      this.audioEnd=this.duration+this.revealDelay+
        (buffers.celebration?buffers.celebration.duration-celebrationOffset:7.8);
    }
    async play(index=3){
      const shield=this.ranks[clamp(index,0,this.ranks.length-1)];
      if(!shield)throw new Error('Invalid rank');
      this._stop();const ticket=this.runId;
      this.reducedMotion=Boolean(global.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
      this.revealDelay=this.reducedMotion?0:.36;
      this.transitionSeconds=this.reducedMotion?0:1.25;
      this.revealed=false;this.evolving=false;this.audioClock=null;
      this.root.classList.remove('is-revealed','is-evolving','is-ripping');
      this.root.classList.add('is-assembling');
      this.root.style.setProperty('--shine','.08');
      this.root.style.setProperty('--evolution','0');
      this.shield.style.opacity='0';
      this.shield.style.transform='scale(.28)';
      const starter=index===0, prior=Math.max(0,index-1);
      const oldPosition=(prior%5*25)+'% '+(prior<5?'0':'100%');
      if(this.previousShield){
        this.previousShield.classList.toggle('is-starter',starter);
        this.previousShield.style.backgroundImage=starter?'none':'url('+JSON.stringify(this.sprite)+')';
        this.previousShield.style.backgroundPosition=oldPosition;
        this.previousShield.style.opacity='0'; // Build its original sprite piece by piece instead.
        this.previousShield.style.transform='scale(1)';
      }
      this.fragments?.classList.toggle('is-starter',starter);
      for(const shard of this.shards){
        const art=shard.querySelector('.shield-shard-art');
        if(art){
          art.style.backgroundImage=starter?'none':'url('+JSON.stringify(this.sprite)+')';
          art.style.backgroundPosition=oldPosition;
        }
      }
      this._assemble(0);
      this.shield.style.backgroundPosition=(index%5*25)+'% '+(index<5?'0':'100%');
      this.shield.setAttribute('aria-label','درع '+shield.name+' الأصلي');
      this.name.textContent='الدرع '+shield.name;
      this.subtitle.textContent=Number(shield.threshold).toLocaleString('en-US')+' كلمة متعلّمة';
      this.counter.textContent='0 XP';this.fill.style.width='0%';
      this.track.setAttribute('aria-valuenow','0');
      this.hint.textContent='جارٍ تركيب الدرع السابق…';
      const audio=await this._prepareAudio();
      if(ticket!==this.runId)return;
      this._scheduleAudio(audio);
      const start=global.performance.now();this.active=true;
      const end=this.audioEnd||this.duration+7.8;
      const frame=()=>{
        if(!this.active)return;
        const t=Math.max(0,this.audioClock!==null&&this.ctx?.state==='running'
          ?this.ctx.currentTime-this.audioClock:(global.performance.now()-start)/1000);
        const p=clamp(t/this.duration,0,1),value=Math.round(shield.threshold*ease(p));
        this.counter.textContent=value.toLocaleString('en-US')+' XP';
        this.fill.style.width=(p*100)+'%';
        this.track.setAttribute('aria-valuenow',String(Math.floor(p*100)));
        if(p<1)this._assemble(p);
        if(p>=1){
          const since=t-this.duration;
          if(!this.evolving){
            this.evolving=true;
            this._assemble(1); // All eight pieces must be fully fitted before they break.
            for(const shard of this.shards){shard.style.opacity='';shard.style.transform='';}
            this.root.classList.remove('is-assembling');
            this.root.classList.add('is-evolving','is-ripping');
            if(this.previousShield)this.previousShield.style.opacity='0';
            this.hint.textContent='الدرع السابق يتمزق…';
          }
          // Shatter animation is time-based, not audio-amplitude-based.
          const tear=clamp(since/Math.max(.01,this.transitionSeconds),0,1);
          const burst=since<0?0:Math.sin(Math.PI*tear);
          this.root.style.setProperty('--evolution',String(Math.max(0,burst).toFixed(3)));
          if(since>=this.revealDelay){
            if(!this.revealed){
              this.revealed=true;
              this.root.classList.add('is-revealed');
              this.hint.textContent='تم فتح الدرع '+shield.name;
              if(global.KalimaHaptics?.pulse)global.KalimaHaptics.pulse();
              else global.navigator?.vibrate?.([65,45,135,50,135]);
            }
            const unveiled=since-this.revealDelay;
            // A single emergence: grows out of the broken rank, then holds still.
            const arrival=ease(unveiled/(this.reducedMotion ? .01 : .78));
            const scale=this.reducedMotion?1:(.28+.72*arrival+.075*Math.sin(Math.PI*arrival));
            this.shield.style.opacity=String(arrival);
            this.shield.style.transform='scale('+scale.toFixed(4)+')';
            this.shield.style.filter='drop-shadow(0 12px 19px #000) drop-shadow(0 0 '+Math.round(22+73*Math.exp(-unveiled*2.4))+'px #ffca66)';
            this.root.style.setProperty('--shine',String((.33+.62*Math.exp(-unveiled*1.8)).toFixed(3)));
          }
        }
        if(t<end+.25)this.raf=global.requestAnimationFrame(frame);
        else{
          this.active=false;this.shield.style.opacity='1';this.shield.style.transform='scale(1)';
          this.root.style.setProperty('--shine','.32');
          this.root.style.setProperty('--evolution','0');
          this.onFinish(shield);
        }
      };
      this.raf=global.requestAnimationFrame(frame);
    }
    setSoundEnabled(enabled){
      this.soundEnabled=Boolean(enabled);
      if(!this.soundEnabled){
        for(const node of this.sources)try{node.stop()}catch{}
        this.sources=[];
      }
    }
    destroy(){this._stop();this.ctx?.close?.();this.ctx=null;}
  }
  global.KalimaLevelUp=Object.freeze({LevelUpCelebration,DEFAULT_RANKS});
})(globalThis);