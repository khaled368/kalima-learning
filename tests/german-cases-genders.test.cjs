'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.join(__dirname,'../dist');
const app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
const css=fs.readFileSync(path.join(dir,'styles.css'),'utf8');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
assert.match(app,/const CASE_ORDER = \[0, 3, 2, 1\]/,'display Nominativ/Akkusativ/Dativ/Genitiv while preserving inflection indexes');
for (const label of ['Nominativ','Akkusativ','Dativ','Genitiv','Maskulin','Feminin','Neutrum','Plural'])
 assert.ok(app.includes(label),'all German grammar labels are available: '+label);
assert.match(app,/GENDERS_DE\.map/,'adjective labels use German column names');
assert.match(app,/CASE_ORDER\.map\(caseIndex =>/,'adjective rows use ordered case index');
assert.match(app,/nounCaseReference\(word\)/,'noun overview has a case and gender reference');
assert.match(app,/DEFINITE_ARTICLES\[index\]\[gender\]/,'reference articles indexed to correct case');
assert.match(app,/\['der', 'die', 'das', 'die'\]/);
assert.match(app,/\['den', 'die', 'das', 'die'\]/);
assert.match(app,/\['dem', 'der', 'dem', 'den'\]/);
assert.match(app,/\['des', 'der', 'des', 'der'\]/);
assert.match(css,/noun-case-scroll/,'table remains usable on small screens');
assert.match(html,/grammar-green-fit-nouns-v13/,'cache bust ships the compact noun tables');
const vm=require('node:vm');
const start=app.indexOf('const CASES = [');
const end=app.indexOf('function addedLetters(',start);
assert.ok(start>=0&&end>start);
const selectors=app.slice(start,end);
const t=word=>word;
const context={t,NATIVE:'ar',TARGET:'de',COURSE:{dir:()=> 'ltr'},esc:value=>String(value)};
const {nounCaseReference,adjectiveTables,nounDeclensionForms}=vm.runInNewContext(selectors+'\n({nounCaseReference,adjectiveTables,nounDeclensionForms})',context);
const noun=nounCaseReference({article:'der'});
assert.match(noun,/<th scope="col"[^>]*>Maskulin<\/th>/);
assert.ok(noun.indexOf('Nominativ')<noun.indexOf('Akkusativ'));
assert.ok(noun.indexOf('Akkusativ')<noun.indexOf('Dativ'));
assert.ok(noun.indexOf('Dativ')<noun.indexOf('Genitiv'));
for(const [name,articles] of [
  ['Nominativ',['der','die','das','die']],
  ['Akkusativ',['den','die','das','die']],
  ['Dativ',['dem','der','dem','den']],
  ['Genitiv',['des','der','des','der']]
]){
  const row=noun.split('<tr>').find(row=>row.includes(name));
  assert.ok(row,'case rendered: '+name);
  const found=[...row.matchAll(/<td[^>]*>(.*?)<\/td>/g)].map(match=>match[1]);
  assert.deepEqual(found,articles,'correct articles in '+name);
}
const adjective=adjectiveTables({declensionStem:'klein',german:'klein'});
assert.equal((adjective.match(/<details class="declension-set"/g)||[]).length,3,'only 3 collapsible compact sets');
assert.equal((adjective.match(/<table class="declension-table"/g)||[]).length,3,'one horizontal matrix per declension set');
assert.equal((adjective.match(/<details class="declension-set" open>/g)||[]).length,1,'only the strong declension table is open by default');
for(const label of ['Maskulin','Feminin','Neutrum','Plural'])
 assert.ok(adjective.includes(label),'gender as column heading: '+label);
for(const set of adjective.split('<details class="declension-set"').slice(1)){
 assert.ok(set.indexOf('Nominativ')<set.indexOf('Akkusativ')&&set.indexOf('Akkusativ')<set.indexOf('Dativ')&&set.indexOf('Dativ')<set.indexOf('Genitiv'),'case order remains correct');
 assert.equal((set.match(/<tr>/g)||[]).length,5,'header plus four grammatical rows');
}
assert.match(adjective,/klein<\/span><span class="ending">er<\/span>/,'strong masculine nominative -er ending');
assert.match(adjective,/class="declension-article">der<\/span>/,'definite article appears in weak pattern');
assert.match(css,/\.declension-table-scroll\{[^}]*overflow-x:auto/,'mobile can scroll sideways instead of growing vertically');
assert.doesNotMatch(adjective,/class="grammar-block gender-/,'old stacked gender blocks removed');

assert.match(css,/#word-dialog \.verb-tense-tabs button\[aria-pressed="true"\]\{[^}]*background:#42c579!important/,'selected verb tense turns bright green');
assert.match(css,/#word-dialog \.noun-case-table\{[^}]*min-width:0/,'four-gender grid fits the viewport');
assert.match(css,/#word-dialog \.noun-case-scroll\{[^}]*overflow-x:hidden/,'no horizontal article-table scroll');
assert.match(app,/function nounDeclensionForms\(word\)/,'forms derive from noun itself');
assert.match(app,/class="noun-forms-table"/,'the noun form table is displayed');
const nouns=nounDeclensionForms;
assert.deepEqual(Array.from(nouns({article:'der',german:'Tisch',plural:'Tische'}).singular),['Tisch','Tisch','Tisch','Tisches']);
assert.deepEqual(Array.from(nouns({article:'der',german:'Tisch',plural:'Tische'}).plural),['Tische','Tische','Tischen','Tische']);
assert.deepEqual(Array.from(nouns({article:'die',german:'Frau',plural:'Frauen'}).singular),['Frau','Frau','Frau','Frau']);
assert.deepEqual(Array.from(nouns({article:'der',german:'Mensch',plural:'Menschen'}).singular),['Mensch','Menschen','Menschen','Menschen']);
assert.deepEqual(Array.from(nouns({article:'der',german:'Name',plural:'Namen'}).singular),['Name','Namen','Namen','Namens']);
assert.equal(nouns({article:'das',german:'Haus',plural:'Häuser'}).singular[3],'Hauses');
assert.equal(nouns({article:'das',german:'Auto',plural:'Autos'}).plural[2],'Autos');
const words=nounCaseReference({article:'der',german:'Tisch',plural:'Tische'});
assert.match(words,/noun-forms-table/);
assert.match(words,/des<\/span> Tisches/);
assert.match(words,/den<\/span> Tischen/);
assert.match(words,/noun-case-table/,'the articles reference is still present');
assert.match(nounCaseReference({article:'das',german:'Wasser'}),/—/,'do not invent a missing plural');

console.log('PASS: compact declension tables are horizontal, accessible, correct and only one opens initially.');
