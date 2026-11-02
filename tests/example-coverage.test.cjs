/* Build-time audit: every shipped word must have bilingual examples across
   all twelve language directions (four target languages, three native each).
   Can run locally with Node 18+: node tests/example-coverage.test.cjs */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..','dist');
function read(p){return JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));}
function contextFor(target,native){
  const env={WORT_COURSE:{target,native},WORT_I18N:{add(){},t(x){return x;}}};
  vm.createContext(env);
  for(const file of ['example-fallback.js','example-quality.js','content.js']){
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),env,{filename:file});
  }
  return env;
}
const languages=['de','en','nl','ar'];
let checked=0,missing=0,contextual=0,wordNotes=0,levelsChecked=0;
for(const target of languages){
  const manifest=read(target==='de'?'data/manifest.json':'data/courses/'+target+'/manifest.json');
  assert.equal(manifest.levels.length,5,'expected all A1–C1 sections');
  for(const native of languages.filter(x=>x!==target)){
    const ctx=contextFor(target,native);
    let local=0,notes=0;
    for(const level of manifest.levels){
      const raw=read(level.data);
      const cards=Array.isArray(raw)?raw:raw.cards;
      assert.equal(cards.length,Number(level.count),'level length mismatch: '+level.data);
      for(const card of cards){
        const normalized=ctx.WORT_CONTENT.normalize(card);
        const examples=normalized.examples;
        const label=target+' -> '+native+' '+level.code+' '+normalized.id+' '+normalized.german;
        assert.ok(normalized.german&&normalized.german.trim(),'empty vocabulary term: '+label);
        assert.ok(Array.isArray(examples)&&examples.length>=1,'missing examples: '+label);
        for(const example of examples){
          assert.ok(typeof example.de==='string'&&example.de.trim(),'example missing target sentence: '+label);
          assert.ok(typeof example.ar==='string'&&example.ar.trim(),'example missing native translation: '+label);
          assert.ok(!example.source?.includes('Tatoeba') || !example.vocabularyNote,'teaching note misattributed to Tatoeba: '+label);
          if(example.vocabularyNote){
            assert.ok(example.source?.trim(),'vocabulary fallback must be attributed: '+label);
            assert.ok(example.de.includes(''+normalized.german),'vocabulary fallback must mention target word: '+label);
          }
        }
        if(examples[0].vocabularyNote){wordNotes++;notes++;}
        else contextual++;
        local++;
      }
      levelsChecked++;
    }
    checked+=local;
    console.log(target+' -> '+native+': '+local+' cards; '+notes+' explicitly labelled non-contextual word-learning fallbacks.');
  }
}
assert.equal(missing,0);
console.log('PASS: '+checked+' entries in '+levelsChecked+' language-level combinations have bilingual example text. Contextual/verified entries: '+contextual+'; labelled word-learning notes: '+wordNotes+'.');
