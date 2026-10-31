import json,pathlib,struct,re,html,collections
p=pathlib.Path(__file__).parent
idx=(p/'German_Arabic_Dict.idx').read_bytes();blob=(p/'German_Arabic_Dict.dict').read_bytes();i=0;direct={};excluded=[]
while i<len(idx):
 z=idx.index(b'\0',i);head=idx[i:z].decode();offset,size=struct.unpack('>II',idx[z+1:z+9]);i=z+9
 value=blob[offset:offset+size].decode();match=re.search(r'<b>(.*?)</b>',value,re.S)
 gloss=html.unescape(re.sub('<[^>]+>','',match.group(1) if match else value)).strip()
 if 'معنى مشتق' in gloss or not re.search('[\u0600-\u06ff]',gloss):excluded.append(head);continue
 # Keep lexical meaning separate from grammatical metadata in the source HTML.
 key=re.sub(r'^(der|die|das|ein|eine)\s+','',head).strip().casefold()
 direct[key]={'german':head,'arabic':gloss,'source':'Mohamed-bouri/german-arabic','license':'MIT'}
(p/'direct-de-ar-map.json').write_text(json.dumps(direct,ensure_ascii=False,separators=(',',':')))
source=json.loads((p/'grundwortschatz-normalized.json').read_text());pivot=json.loads((p/'german-arabic-pivot.json').read_text());cur=json.loads((p/'curated-details.json').read_text())
print('cur type',type(cur).__name__)
if not isinstance(cur,list):cur=list(cur.values())
curmap={str(w.get('german','')).casefold():w for w in cur}
output=[];counts=collections.Counter();unique={};missing=[]
for w in source:
 key=w['german'].casefold();meaning=direct.get(key) or direct.get(str(w.get('lemma') or '').casefold());manual=curmap.get(key);pv=pivot.get(str(w['sourceId']))
 if manual and manual.get('arabic'):w['arabic']=manual['arabic'];kind='curated'
 elif meaning:w['arabic']=meaning['arabic'];kind='direct'
 elif pv:w['arabic']=pv['arabic'];kind='pivot';w['translationPivots']=pv['pivots']
 else:w['arabic']='';kind='missing'
 w['translationKind']=kind;output.append(w)
 if w.get('originalPos')!='proper_noun' and w.get('german'):
  old=unique.get(key)
  if old is None or (old['translationKind']=='missing' and kind!='missing'):unique[key]=w
for w in unique.values():
 counts[w['translationKind']]+=1
 if w['translationKind']=='missing':missing.append({'sourceId':w['sourceId'],'german':w['german'],'english':w['english'],'definitions':w['definitions']})
(p/'combined-candidates.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')))
(p/'combined-missing.json').write_text(json.dumps(missing,ensure_ascii=False,indent=2))
print('direct genuine',len(direct),'synthetic excluded',len(excluded));print('rows',len(output),'unique nonproper surfaces',len(unique),'coverage',dict(counts));print('samples',json.dumps({x:direct.get(x.casefold()) for x in ['Apfel','hart','gehen','Buch','Abend']},ensure_ascii=False));print('missing sample',json.dumps(missing[:12],ensure_ascii=False))
