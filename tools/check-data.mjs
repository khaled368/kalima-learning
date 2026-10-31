import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../dist/data/',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root),'utf8'));
const levels=['A1','A2','B1','B2','C1'];
const ids=new Set(),headwords=new Set();let count=0,exampleCount=0;
for(const level of levels){
 const words=JSON.parse(fs.readFileSync(new URL(level+'.json',root),'utf8'));
 if(process.argv.includes('--target'))assert.equal(words.length,2000,`${level} must have 2000 real entries`);
 assert.equal(manifest.levels.find(l=>l.code===level)?.count,words.length);
 for(const word of words){
  assert.equal(word.level,level);
  assert(!ids.has(word.id),`Duplicate id ${word.id}`);ids.add(word.id);
  const normalized=word.german.normalize('NFC').toLocaleLowerCase().trim();
  assert(normalized&&normalized.length>0,`Empty headword ${word.id}`);
  assert(!headwords.has(normalized),`Repeated headword ${word.german}`);headwords.add(normalized);
  assert(typeof word.arabic==='string'&&/[\u0600-\u06ff]/u.test(word.arabic),`Missing Arabic meaning ${word.german}`);
  assert(Array.isArray(word.examples)&&word.examples.some(e=>typeof e.de==='string'&&e.de.trim()),`Missing example ${word.german}`);
  exampleCount+=word.examples.length;
  count++;
 }
}
for(let id=0;id<90;id++)assert(ids.has(id),`Lost original id ${id}`);
if(process.argv.includes('--target'))assert.equal(count,10000);assert.equal(manifest.shields.length,10);
console.log(`Verified ${count} unique headwords, ${manifest.levels.map(l=>l.code+':'+l.count).join(', ')}, ${exampleCount} examples, original saved IDs and 10 shields.`);
