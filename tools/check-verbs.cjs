'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');const data=JSON.parse(fs.readFileSync(path.join(root,'dist/data/verbs.json')));
for(const [lemma,record]of Object.entries(data.verbs)){
 for(const tense of ['present','preterite','perfect']){
  assert.equal(record[tense].length,6,`${lemma} ${tense} length`);
  assert(record[tense].every(form=>typeof form==='string'&&form.length),`${lemma} ${tense} blank`);
 }
 assert(record.infinitive&&record.lexicalStem,`${lemma} missing reference`);
}
const context={fetch:async()=>({ok:true,json:async()=>data})};vm.runInNewContext(fs.readFileSync(path.join(root,'dist/verbs.js'),'utf8'),context);
(async()=>{await context.WORT_VERBS.load();
const get=w=>context.WORT_VERBS.lookup(w);
const cases=[
 ['sein','present',['bin','bist','ist','sind','seid','sind']],
 ['haben','present',['habe','hast','hat','haben','habt','haben']],
 ['werden','present',['werde','wirst','wird','werden','werdet','werden']],
 ['müssen','present',['muss','musst','muss','müssen','müsst','müssen']],
 ['wissen','present',['weiß','weißt','weiß','wissen','wisst','wissen']],
 ['gehen','preterite',['ging','gingst','ging','gingen','gingt','gingen']],
 ['arbeiten','present',['arbeite','arbeitest','arbeitet','arbeiten','arbeitet','arbeiten']],
 ['lesen','present',['lese','liest','liest','lesen','lest','lesen']],
 ['anrufen','present',['rufe an','rufst an','ruft an','rufen an','ruft an','rufen an']],
 ['sammeln','present',['sammle','sammelst','sammelt','sammeln','sammelt','sammeln']]
];for(const [word,tense,expected]of cases)assert.deepEqual(Array.from(get(word)[tense]),expected,word+' '+tense);
assert.equal(get('rechnen').present[4],'rechnet');assert.equal(get('zeichnen').present[4],'zeichnet');assert.equal(get('wohnen').present[4],'wohnt');
assert.equal(get('gehen').perfect[0],'bin gegangen');
assert.equal(get('anrufen').perfect[0],'habe angerufen');
assert.equal(get('wehtun').present[0],'tue weh');
assert.equal(get('wehtun').perfect[0],'habe wehgetan');
assert.equal(get('loswerden').perfect[0],'bin losgeworden');
assert.equal(get('sich bewerben').present[0],'bewerbe mich');
assert.equal(get('sich bewerben').present[1],'bewirbst dich');
assert.equal(get('sich bewerben').perfect[0],'habe mich beworben');
assert.equal(get('Nimm').infinitive,'nehmen');
assert.equal(get('musst').infinitive,'müssen');
assert.equal(get('wisst').infinitive,'wissen');
assert.equal(get('erschrak').perfect[0],'bin erschrocken');
assert.equal(get('hing').perfect[0],'habe gehangen');
assert.equal(get({german:'Leben',pos:'noun'}),null);
assert.equal(get('regnen').present[0],'—');assert.equal(get('regnen').present[2],'regnet');
assert.equal(get('Auto fahren').present[0],'fahre Auto');
assert.equal(get('Auto fahren').perfect[0],'bin Auto gefahren');
const repairs=JSON.parse(fs.readFileSync(path.join(root,'tools/verb-card-repairs.json')));
let count=0;for(const level of ['A1','A2','B1','B2','C1'])for(const original of JSON.parse(fs.readFileSync(path.join(root,'dist/data/'+level+'.json')))){
 const word={...original,...(repairs[original.id]||{})};if(word.pos!=='verb')continue;count++;
 const record=get(word);assert(record,`No lookup for ${word.german} (${word.id})`);
 for(const tense of ['present','preterite','perfect'])assert.equal(record[tense].length,6);
}
assert.equal(count,data.coverage.verbCards);
console.log(`Verified ${count} verb cards, ${Object.keys(data.verbs).length} paradigms; six-person tables, common irregulars, separable/reflexive forms, modern orthography and nonverbs.`);
})().catch(e=>{console.error(e);process.exitCode=1});
