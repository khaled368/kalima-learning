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
assert.match(app,/const genders = GENDERS_DE/,'adjective labels use German names');
assert.match(app,/CASE_ORDER\.map\(index => \{ const \[name, explanation\] = CASES\[index\]/,'adjective rows use ordered case index');
assert.match(app,/nounCaseReference\(word\)/,'noun overview has a case and gender reference');
assert.match(app,/DEFINITE_ARTICLES\[index\]\[gender\]/,'reference articles indexed to correct case');
assert.match(app,/\['der', 'die', 'das', 'die'\]/);
assert.match(app,/\['den', 'die', 'das', 'die'\]/);
assert.match(app,/\['dem', 'der', 'dem', 'den'\]/);
assert.match(app,/\['des', 'der', 'des', 'der'\]/);
assert.match(css,/noun-case-scroll/,'table remains usable on small screens');
assert.match(html,/german-cases-genders-v11/,'cache bust ships the change');
const vm=require('node:vm');
const start=app.indexOf('const CASES = [');
const end=app.indexOf('function addedLetters(',start);
assert.ok(start>=0&&end>start);
const selectors=app.slice(start,end);
const t=word=>word;
const context={t,NATIVE:'ar',TARGET:'de',COURSE:{dir:()=> 'ltr'},esc:value=>String(value)};
const {nounCaseReference,adjectiveTables}=vm.runInNewContext(selectors+'\n({nounCaseReference,adjectiveTables})',context);
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
assert.ok(adjective.includes('Maskulin')&&adjective.includes('Feminin')&&adjective.includes('Neutrum')&&adjective.includes('Plural'));
const strong=adjective.split('<section class="grammar-section">')[1];
assert.ok(strong.indexOf('Nominativ')<strong.indexOf('Akkusativ')&&strong.indexOf('Akkusativ')<strong.indexOf('Dativ')&&strong.indexOf('Dativ')<strong.indexOf('Genitiv'));
console.log('PASS: case/gender German names and accurate noun/adjective cases, article grid, declension ordering.');
