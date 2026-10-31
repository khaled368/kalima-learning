import sqlite3,json,collections,re,pathlib
root=pathlib.Path('/workspace/sites/wort/data-sources')
c=sqlite3.connect(root/'grundwortschatz-app.db');c.row_factory=sqlite3.Row
translations=collections.defaultdict(list)
for r in c.execute('select word_id,translation from translations where lang_code="en"'):
 if r['translation'] and r['translation'] not in translations[r['word_id']]:translations[r['word_id']].append(r['translation'])
output=[]
for r in c.execute('select * from words order by id'):
 e=json.loads(r['enrichment_json'] or '{}');m=json.loads(r['metadata_json'] or '{}');f=json.loads(r['frequency_json'] or '{}')
 examples=[];texts=set()
 for sentence in m.get('tatoeba_examples',[]) or []:
  if isinstance(sentence,dict):sentence=sentence.get('text') or sentence.get('sentence')
  if not isinstance(sentence,str) or sentence in texts:continue
  if len(sentence)>240:continue
  examples.append({'de':sentence,'ar':'','source':'Tatoeba via WortUniversum','sourceUrl':'https://tatoeba.org/','license':'CC BY 2.0 FR'});texts.add(sentence)
  if len(examples)>=3:break
 if not examples:
  grades=m.get('grade_examples') or {}
  for grade,sentences in sorted(grades.items()):
   for sentence in sentences:
    if not isinstance(sentence,str) or sentence in texts or len(sentence)>240:continue
    examples.append({'de':sentence,'ar':'','source':'WortUniversum generated learning example','generated':True});texts.add(sentence)
    if len(examples)>=2:break
   if len(examples)>=2:break
 if not examples:
  for ex in e.get('examples',[]) or []:
   sentence=ex.get('text')
   if not sentence or ex.get('ref') or ex.get('author') or len(sentence)>160 or sentence.startswith(('„','“','"')):continue
   examples.append({'de':sentence,'ar':'','source':'German Wiktionary via WortUniversum','sourceUrl':'https://de.wiktionary.org/wiki/'+r['word'],'license':'CC BY-SA 4.0'})
   if len(examples)>=2:break
 forms=[]
 for form in e.get('inflections',[]) or []:
  value=form.get('form_text');tags=form.get('tags') or ''
  if value:forms.append({'form':value,'tags':[t.strip() for t in tags.split(',') if t.strip()]})
 pos=e.get('primary_pos') or r['word_type'] or ''
 ips=[p['ipa'] for p in e.get('pronunciation',[]) or [] if p.get('ipa')]
 ranks=[v.get('rank') for v in f.values() if isinstance(v,dict) and isinstance(v.get('rank'),(int,float))]
 cefr=[l for l in ['A1','A2','B1','B2','C1','C2'] if l in m.get('sources',[])]
 output.append({'sourceId':r['id'],'german':r['word'],'lemma':r['lemma'],'article':r['article'] or '', 'genus':r['genus'] or '', 'pos':pos,'originalPos':r['word_type'] or '', 'ipa':ips[0] if ips else '', 'definitions':e.get('definitions',[])[:3], 'english':translations[r['id']][:5], 'examples':examples,'forms':forms,'frequency':m.get('averageRank') or (sum(ranks)/len(ranks) if ranks else 1e9),'cefrTags':cefr, 'sourceUrl':'https://de.wiktionary.org/wiki/'+r['word'],'audio':r['audio_path'] or ''})
p=root/'grundwortschatz-normalized.json';p.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')))
print('Wrote',len(output),'rows;',p.stat().st_size,'bytes')
print('examples',sum(bool(w['examples']) for w in output),'forms',sum(bool(w['forms']) for w in output),'english',sum(bool(w['english']) for w in output))
print('proper nouns',sum(w['originalPos']=='proper_noun' for w in output))
print('hart sample',json.dumps(next(w for w in output if w['german']=='hart'),ensure_ascii=False)[:3500])
