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
      this.onFinish=options.onFinish||(()=>{});
      this.counter=this.root.querySelector('#score-number');
      this.fill=this.root.querySelector('#progress-fill');
      this.track=this.root.querySelector('#progress-track');
      this.shield=this.root.querySelector('#shield');
      this.hint=this.root.querySelector('#score-hint');
      this.name=this.root.querySelector('#rank-name');
      this.subtitle=this.root.querySelector('#rank-subtitle');
      this.shield.style.backgroundImage='url('+JSON.stringify(this.sprite)+')';
      this.ctx=null;this.sources=[];this.raf=0;this.active=false;this.revealed=false;
      this.bass=0;this.beatPulse=0;this.lastBeatAt=-1;this.lastFrame=0;
      this.samples=null;this.previousSpectrum=null;this.energyBaseline=0;
      this.analyser=null;this.audioClock=null;this.runId=0;
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
      if(!buffers||!this.ctx){this.audioEnd=this.duration+7.8;return;}
      const now=this.ctx.currentTime+.08;
      this.audioClock=now;
      const start=(buffer,when,limit=null,bass=false)=>{
        if(!buffer)return;
        const source=this.ctx.createBufferSource();source.buffer=buffer;
        const gain=this.ctx.createGain();gain.gain.value=.85;
        if(bass){
          const analyser=this.ctx.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.20;
          source.connect(analyser);analyser.connect(gain);this.analyser=analyser;
          this.samples=new Uint8Array(analyser.frequencyBinCount);
          this.previousSpectrum=new Float32Array(analyser.frequencyBinCount);
          this.energyBaseline=0;
        }else source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(when);
        if(limit!==null)source.stop(when+Math.min(limit,buffer.duration));
        this.sources.push(source);
      };
      start(buffers.progress,now,this.duration,false);
      start(buffers.celebration,now+this.duration,null,true);
      this.audioEnd=this.duration+(buffers.celebration?.duration||7.8);
    }
    _bassLevel(){
      if(!this.analyser||!this.samples)return {level:0,hit:0};
      this.analyser.getByteFrequencyData(this.samples);
      // Several FFT bins from 45-300 Hz catch real kicks, not one narrow bin.
      const step=this.ctx.sampleRate/this.analyser.fftSize;
      const low=Math.max(1,Math.ceil(45/step));
      const high=Math.min(this.samples.length-1,Math.floor(300/step));
      if(high<low)return {level:0,hit:0};
      if(!this.previousSpectrum||this.previousSpectrum.length!==this.samples.length)
        this.previousSpectrum=new Float32Array(this.samples.length);
      let volume=0,attack=0,weightTotal=0;
      for(let i=low;i<=high;i++){
        const weight=i*step<170?1:.65;
        const v=this.samples[i];
        volume+=v*weight;
        attack+=Math.max(0,v-this.previousSpectrum[i])*weight;
        weightTotal+=weight;
        this.previousSpectrum[i]=v;
      }
      const energy=volume/Math.max(1,weightTotal);
      const transient=attack/Math.max(1,weightTotal);
      const baseline=this.energyBaseline||0;
      this.energyBaseline+=(energy-this.energyBaseline)*.045;
      const onset=clamp((transient-2.5)/29,0,1);
      const accent=clamp((energy-baseline*1.12-6)/54,0,1);
      return {level:clamp((energy-9)/105,0,1),hit:Math.max(onset,accent*.76*clamp(transient/12,0,1))};
    }
    async play(index=3){
      const shield=this.ranks[clamp(index,0,this.ranks.length-1)];
      if(!shield)throw new Error('Invalid rank');
      this._stop();const ticket=this.runId;
      this.revealed=false;this.analyser=null;this.bass=0;this.beatPulse=0;
      this.lastBeatAt=-1;this.lastFrame=0;this.audioClock=null;this.energyBaseline=0;
      this.root.classList.remove('is-revealed');
      this.root.style.setProperty('--shine','.1');
      this.root.style.setProperty('--beat','0');this.root.style.setProperty('--glow-scale','1');
      this.shield.style.opacity='0';this.shield.style.transform='scale(.1)';
      this.shield.style.backgroundPosition=(index%5*25)+'% '+(index<5?'0':'100%');
      this.shield.setAttribute('aria-label','درع '+shield.name+' الأصلي');
      this.name.textContent='الدرع '+shield.name;
      this.subtitle.textContent=Number(shield.threshold).toLocaleString('en-US')+' كلمة متعلّمة';
      this.counter.textContent='0 XP';this.fill.style.width='0%';
      this.track.setAttribute('aria-valuenow','0');
      this.hint.textContent='جارٍ احتساب النقاط…';
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
        if(p>=1){
          if(!this.revealed){
            this.revealed=true;this.root.classList.add('is-revealed');
            this.hint.textContent='تم فتح الدرع '+shield.name;
            if(global.KalimaHaptics?.pulse)global.KalimaHaptics.pulse();
            else global.navigator?.vibrate?.([65,45,135,50,135]);
          }
          const since=t-this.duration;
          const dt=Math.min(.08,Math.max(0,since-this.lastFrame));
          this.lastFrame=since;
          const fade=1-ease((since-3.6)/1.8); // Calm ending.
          const bass=this._bassLevel();
          this.bass+=(bass.level-this.bass)*(bass.level>this.bass?.42:.13);
          // Only real low-frequency transients trigger a fresh size pulse.
          if(bass.level>.11&&bass.hit>.24&&since-this.lastBeatAt>.16){
            this.beatPulse=Math.max(this.beatPulse,.52+.48*bass.hit);
            this.lastBeatAt=since;
          }
          this.beatPulse*=Math.exp(-Math.max(.008,dt)*7.2);
          const beat=this.beatPulse*fade;
          const impact=Math.exp(-since*9)*.22;
          const pulse=beat*.52+this.bass*.07*fade+impact;
          const arrival=ease(since/.42);
          const scale=(.6+.4*arrival)*(1+pulse);
          this.shield.style.opacity=String(arrival);
          this.shield.style.transform='scale('+scale.toFixed(4)+')';
          this.shield.style.filter='drop-shadow(0 12px 19px #000) drop-shadow(0 0 '+Math.round(19+105*beat+31*this.bass*fade+34*impact)+'px #ffca66)';
          this.root.style.setProperty('--beat',beat.toFixed(3));
          this.root.style.setProperty('--glow-scale',(1+beat*.27).toFixed(3));
          this.root.style.setProperty('--shine',String(clamp(.26+beat*.78+this.bass*.15*fade+impact,0,1)));
        }
        if(t<end+.25)this.raf=global.requestAnimationFrame(frame);
        else{
          this.active=false;this.shield.style.opacity='1';this.shield.style.transform='scale(1)';
          this.root.style.setProperty('--shine','.32');
          this.root.style.setProperty('--beat','0');this.root.style.setProperty('--glow-scale','1');
          this.onFinish(shield);
        }
      };
      this.raf=global.requestAnimationFrame(frame);
    }
    setSoundEnabled(enabled){
      this.soundEnabled=Boolean(enabled);
      if(!this.soundEnabled){
        for(const node of this.sources)try{node.stop()}catch{}
        this.sources=[];this.analyser=null;
      }
    }
    destroy(){this._stop();this.ctx?.close?.();this.ctx=null;}
  }
  global.KalimaLevelUp=Object.freeze({LevelUpCelebration,DEFAULT_RANKS});
})(globalThis);