import tarfile,xml.etree.ElementTree as ET,json,pathlib,re,collections,time
p=pathlib.Path(__file__).parent;index=json.loads((p/'hf-example-token-index.json').read_text());ar=json.loads((p/'eng-ara-map.json').read_text());hf=json.loads((p/'grundwortschatz-normalized.json').read_text());existing={w['german'].casefold() for w in hf}|{str(w.get('lemma') or '').casefold() for w in hf};ns={'t':'http://www.tei-c.org/ns/1.0'};outs={};seen=0;gram=collections.Counter();own_examples=0;newmap={};start=time.monotonic()
with tarfile.open(p/'freedict-deu-eng.src.tar.xz') as t:
 copying=t.extractfile('deu-eng/COPYING').read();(p/'FREEDICT-DEU-ENG-COPYING.txt').write_bytes(copying)
 f=t.extractfile('deu-eng/deu-eng.tei')
 for _,e in ET.iterparse(f,events=('end',)):
  if e.tag!='{http://www.tei-c.org/ns/1.0}entry':continue
  seen+=1
  head=e.findtext('./t:form/t:orth',namespaces=ns) or '';key=head.casefold();g=e.find('t:gramGrp',ns);gr={x.tag.split('}')[-1]:''.join(x.itertext()) for x in g} if g is not None else {};gram.update([(gr.get('pos',''),gr.get('number',''),gr.get('tns',''),gr.get('mood',''))])
  english=[q.text for q in e.findall('./t:sense/t:cit[@type="trans"]/t:quote',ns) if q.text];meanings=[];pivots=[]
  for en in english:
   variants=[en.lower().strip(),re.sub(r'^to ','',en.lower().strip()),re.sub(r'\s*\([^)]*\)','',en.lower()).strip()]
   for v in dict.fromkeys(variants):
    if v in ar:
     for a in ar[v][:2]:
      if a not in meanings:meanings.append(a);pivots.append({'en':en,'ar':a})
     break
   if len(meanings)>=3:break
  # Also collect replacement English -> Arabic candidates for original source omissions.
  if meanings and key in existing and key not in newmap:newmap[key]={'english':english[:6],'arabic':'؛ '.join(meanings[:3]),'pivots':pivots[:3]}
  if key in existing or key in outs or not re.fullmatch('[A-Za-zÄÖÜäöüß]{3,32}',head) or not meanings:e.clear();continue
  # Reject annotated proper names and nonlemma number/tense forms.
  domain=' '.join(e.itertext())
  if gr.get('number')=='pl' or gr.get('tns') or gr.get('mood') or gr.get('pos') in ['name','prop'] or re.search(r'\b(?:Vorname|Familienname|surname|given name|proper name)\b',domain,re.I):e.clear();continue
  examples=index.get(key,[])
  matchkind='HFwholeword'
  if not examples:
   sentences=[]
   for cit in e.findall('./t:sense/t:cit[@type="example"]',ns):
    for quote in cit.findall('t:quote',ns):
     if quote.attrib.get('{http://www.w3.org/XML/1998/namespace}lang')!='de':continue
     text=' '.join(''.join(quote.itertext()).split())
     if 12<=len(text)<=180 and re.search(r'(?<!\w)'+re.escape(head)+r'(?!\w)',text,re.I):sentences.append(text)
   if sentences:
    sentences.sort(key=len);examples=[{'de':s,'ar':'','source':'Ding/FreeDict dictionary','sourceUrl':'https://dict.tu-chemnitz.de/','license':'GPL-3.0 and AGPL-3.0 (combined TEI)'} for s in sentences[:2]];matchkind='DingExample';own_examples+=1
  if examples:
   pos={'n':'noun','v':'verb','adj':'adjective','adv':'adverb','prep':'preposition','conj':'conjunction'}.get(gr.get('pos'),gr.get('pos') or '')
   gender=gr.get('gen','');article={'masc':'der','fem':'die','neut':'das'}.get(gender,'')
   outs[key]={'sourceId':'ding-'+(e.attrib.get('{http://www.w3.org/XML/1998/namespace}id') or key),'german':head,'lemma':head,'article':article,'pos':pos,'ipa':'','definitions':[],'english':english[:5],'arabic':'؛ '.join(meanings[:3]),'translationKind':'pivot','translationPivots':pivots[:3],'examples':examples[:2],'forms':[],'frequency':1e9,'cefrTags':[],'sourceUrl':'https://dict.tu-chemnitz.de/','exampleMatchKind':matchkind,'grammar':gr}
  e.clear()
  if seen%100000==0:print('progress',seen,'matches',len(outs),'HF',sum(w['exampleMatchKind']=='HFwholeword' for w in outs.values()),'seconds',round(time.monotonic()-start),flush=True)
(p/'ding-additional-candidates.json').write_text(json.dumps(list(outs.values()),ensure_ascii=False,separators=(',',':')))
(p/'ding-hf-arabic-map.json').write_text(json.dumps(newmap,ensure_ascii=False,separators=(',',':')))
(p/'ding-grammar-stats.json').write_text(json.dumps([(list(k),v) for k,v in gram.most_common()],ensure_ascii=False))
print('FINISH entries',seen,'newheadwordexamples',len(outs),'source',dict(collections.Counter(w['exampleMatchKind'] for w in outs.values())),'HFtranslationMap',len(newmap),'secs',round(time.monotonic()-start));print('samples',json.dumps(list(outs.values())[:8],ensure_ascii=False)[:5000]);print('grammar',gram.most_common(12))
