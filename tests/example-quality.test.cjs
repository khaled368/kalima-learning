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
  for (const file of ['example-curated-a1.js','example-fallback.js','example-quality.js','content.js']) {
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
assert.equal(without.examples.length,1,'every entry has at least one example or labelled fallback');
assert.equal(without.examples[0].vocabularyNote,true,'generic fallback is explicitly not presented as contextual usage');
assert.equal(without.examples[0].de.includes('„Moment“'),true,'fallback clearly names the word');
const daughter=de.WORT_CONTENT.normalize({id:'a1-daughter',german:'Tochter',lemma:'Tochter',pos:'noun',arabic:'ابنة',examples:[]});
assert.equal(daughter.examples.length,1,'A1 missing nouns now receive a genuine contextual example');
assert.equal(daughter.examples[0].de,'Meine Tochter geht heute zur Schule.','authored noun context is accurate');
assert.equal(daughter.examples[0].ar,'تذهب ابنتي إلى المدرسة اليوم.','Arabic translation matches the noun sentence');
const call = de.WORT_CONTENT.normalize({
  id:'anrufen-test',german:'anrufen',lemma:'anrufen',pos:'verb',arabic:'يتصل هاتفيًا',
  examples:[{de:'Haben Sie abgenommen?',ar:'هل فقدت الوزن؟'}]
});
assert.equal(call.examples.length,3,'anrufen has three authored contextual examples');
assert.equal(call.examples.some(x=>x.de.includes('rufe')&&x.de.includes(' an.')),true,'anrufen separable example present');
assert.equal(call.examples.every(x=>x.kalimaAuthored),true,'curated examples are clearly attributed');
const approach=de.WORT_CONTENT.normalize({id:'naehern-test',german:'nähern',lemma:'nähern',pos:'verb',arabic:'يقترب',examples:[]});
assert.equal(approach.examples.length,3,'nähern has three meaningful contextual examples');
assert.equal(approach.examples[0].de,'Wir nähern uns dem Bahnhof.','nähern is used reflexively with dative');
assert.equal(approach.examples[0].ar,'نحن نقترب من محطة القطار.','nähern contextual example has correct Arabic translation');
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
const noEnglishSource=english.WORT_CONTENT.normalize({id:'en-fallback',pos:'verb',texts:{en:'help',ar:'يساعد'},examples:[]});
assert.equal(noEnglishSource.examples.length,1,'missing English example is handled');
assert.equal(noEnglishSource.examples[0].de,'Today I am learning the word “help”.','English target sentence is grammatically correct');
assert.equal(noEnglishSource.examples[0].ar,'أتعلّم اليوم كلمة «help».','Arabic explanation matches target sentence');
const dutch=start('nl','ar').WORT_CONTENT.normalize({id:'nl-test',pos:'noun',texts:{nl:'huis',ar:'بيت'},examples:[]});
assert.equal(dutch.examples[0].de,'Vandaag leer ik het woord ‘huis’.','Dutch fallback exists');
const arabic=start('ar','en').WORT_CONTENT.normalize({id:'ar-test',pos:'noun',texts:{ar:'كتاب',en:'book'},examples:[]});
assert.equal(arabic.examples[0].de,'أتعلّم اليوم كلمة «كتاب».','Arabic target fallback exists');
assert.equal(arabic.examples[0].ar,'Today I am learning the word “كتاب”.','English native translation exists');

console.log('PASS: correct source examples, genuine authored verbs, and labelled fallback for all target languages.');
