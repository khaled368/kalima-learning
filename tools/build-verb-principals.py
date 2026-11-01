import sqlite3,json,re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
c=sqlite3.connect(root/'data-sources/grundwortschatz-app.db')
D={}
for source_id,word,lemma,word_type,enrichment in c.execute('select id,word,lemma,word_type,enrichment_json from words'):
 e=json.loads(enrichment or '{}');f=e.get('inflections',[])
 present=[x['form_text'] for x in f if x.get('tags')=='present']
 if not present:continue
 past=[x['form_text'] for x in f if x.get('tags')=='past']
 participles=[];aux=[];inf=[];imp=[];subj=[]
 for x in f:
  text=x.get('form_text','');tags=set((x.get('tags') or '').split(', '))
  if 'obsolete'in tags or 'archaic'in tags:continue
  if ('participle-2'in tags and 'perfect'in tags) or ('participle'in tags and 'perfect'in tags and 'infinitive'not in tags):participles.append(text)
  if tags=={'perfect','auxiliary'} and text in ['haben','sein']:aux.append(text)
  if all(t in tags for t in ['present','active','infinitive']) and not any(t in tags for t in ['extended','passive']):inf.append(text)
  if all(t in tags for t in ['perfect','active','infinitive']) and 'extended'not in tags:
   for a in ['haben','sein']:
    if text.endswith(' '+a):
     participles.append(text[:-len(a)-1]);aux.append(a)
  if 'imperative'in tags:imp.append(text.replace('!',''))
  if tags=={'subjunctive-ii'}:subj.append(text)
 name=next((x for x in inf if re.fullmatch('[A-Za-zÄÖÜäöüß]+',x)),None)
 if not name:name=lemma if lemma and re.fullmatch('[A-Za-zÄÖÜäöüß]+',lemma) else word
 if not re.fullmatch('[A-Za-zÄÖÜäöüß]+',name):continue
 key=name.lower();item={'infinitive':key,'present':present,'past':past,'participle':list(dict.fromkeys(participles)),'auxiliary':list(dict.fromkeys(aux)),'imperative':imp,'subjunctive':subj,'source':'Wiktionary via WortUniversum','sourceId':source_id}
 score=len(present)*10+len(past)*3+len(participles)*3+len(aux)+(word==name)*5
 if key not in D or score>D[key]['_score']:item['_score']=score;D[key]=item
for w in D.values():w.pop('_score',None)
(root/'data-sources/verb-principals.json').write_text(json.dumps(D,ensure_ascii=False,separators=(',',':')))
print('Principal-part lemmas',len(D))
