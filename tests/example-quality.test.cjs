/* Node regression tests for the public Kalima example-relevance gate.
   Run: node tests/example-quality.test.cjs (Node 18+, no dependencies). */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
function start(target='de',native='ar') {
  const context = {
    WORT_COURSE:{target,native},
    WORT_I18N:{add(){},t(input){return input;}}
  };
  vm.createContext(context);
  for (const file of ['example-quality.js','content.js']) {
    const source=fs.readFileSync(path.join(root,'dist',file),'utf8');
    vm.runInContext(source,context,{filename:file});
  }
  return context;
}
const de=start();
const gate=de.WORT_EXAMPLE_QUALITY;
const yes=(label,word,example)=>assert.equal(gate.relevant(word,example,'de'),true,label);
const no=(label,word,example)=>assert.equal(gate.relevant(word,example,'de'),false,label);
const vorstellen={lemma:'vorstellen',pos:'verb'};
no('bad unrelated screenshot example #1',vorstellen,'Haben Sie’s?');
no('bad unrelated screenshot example #2',vorstellen,'Haben Sie abgenommen?');
yes('infinitive reflexive',vorstellen,'Ich möchte mich vorstellen.');
yes('separable reflexive',vorstellen,'Ich stelle mich vor.');
yes('perfect participle',vorstellen,'Ich habe mich vorgestellt.');
no('bare stellen not vorstellen',vorstellen,'Ich stelle das Glas auf den Tisch.');
no('preposition vor preceding unrelated verb',vorstellen,'Vor dem Haus stellte er sich auf.');
yes('irregular conjugation', {lemma:'sehen',pos:'verb'},'Ich sah sie gestern.');
yes('separable verb',{lemma:'aufstehen',pos:'verb'},'Er steht früh auf.');
no('separable verb without particle',{lemma:'aufstehen',pos:'verb'},'Er steht dort.');
yes('real plural',{lemma:'Haus',plural:'Häuser',pos:'noun'},'Die Häuser sind groß.');
yes('adjective inflection',{lemma:'schlecht',pos:'adjective'},'Das ist ein schlechter Tag.');
yes('irregular comparison',{lemma:'gut',pos:'adjective'},'Es ist besser so.');
no('random sentence unrelated to noun',{lemma:'Moment',pos:'noun'},'Haben Sie abgenommen?');
const normalized=de.WORT_CONTENT.normalize({
  id:'sample-A1',german:'vorstellen',lemma:'vorstellen',pos:'verb',level:'A1',arabic:'يعرّف بنفسه؛ يتخيّل',
  examples:[{de:'Haben Sie’s?',ar:'هل حصلت عليه؟'},{de:'Haben Sie abgenommen?',ar:'هل نقص وزنك؟'}]
});
assert.equal(normalized.examples.length,3,'specific known-bad German entry gets reviewed examples');
assert.equal(normalized.examples.every(x=>gate.relevant(vorstellen,x.de,'de')),true,'all reviewed examples match');
assert.equal(normalized.examples.some(x=>x.de.includes('Haben Sie')),false,'unrelated screenshot examples are excluded');
const moment=de.WORT_CONTENT.normalize({
  id:'sample-A1-b',german:'Moment',pos:'noun',level:'A1',arabic:'لحظة',
  examples:[{de:'Moment mal!',ar:'انتظر لحظة!'},{de:'Gute Nacht!',ar:'تصبح على خير!'}]
});
assert.equal(moment.examples.length,1,'ordinary cards filter unrelated source examples');
assert.equal(moment.examples[0].de,'Moment mal!','related source example is retained');
const without=de.WORT_CONTENT.normalize({id:'sample-empty',german:'Moment',pos:'noun',arabic:'لحظة',examples:[{de:'Gute Nacht!',ar:'تصبح على خير!'}]});
assert.equal(without.examples.length,0,'no fabricated examples for general vocabulary');
const english=start('en','ar');
const englishEntry=english.WORT_CONTENT.normalize({
  id:'en-1',pos:'noun',texts:{en:'book',ar:'كتاب'},
  examples:[
    {texts:{en:'This book is new.',ar:'هذا الكتاب جديد.'}},
    {texts:{en:'The weather is nice.',ar:'الطقس جميل.'}}
  ]
});
assert.equal(englishEntry.examples.length,1,'English lessons also filter unrelated examples');
assert.equal(englishEntry.examples[0].de,'This book is new.','English relevant source sentence remains');
console.log('PASS: verified examples and word normalization across German and English.');
