import json,pathlib,re,collections
p=pathlib.Path(__file__).parent;d=json.loads((p/'grundwortschatz-normalized.json').read_text());existing={w['german'].casefold() for w in d}|{str(w.get('lemma') or '').casefold() for w in d};index=collections.defaultdict(list);sentences=set()
# Prefer short, plain learning sentences and preserve original source attribution.
examples=[]
for w in d:
 for ex in w.get('examples',[]):
  text=ex.get('de','').strip()
  if not text or text in sentences:continue
  sentences.add(text);examples.append(ex)
examples.sort(key=lambda ex:(bool(ex.get('generated')),len(ex['de'])))
for ex in examples:
 for token in set(re.findall(r'\b[A-Za-zÄÖÜäöüß]+\b',ex['de'])):
  key=token.casefold()
  if len(token)<3 or key in existing:continue
  if len(index[key])>=3:continue
  index[key].append(ex)
(p/'hf-example-token-index.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':')))
print('distinct sentences',len(examples),'tokens not in HFsurfaces/lemmas',len(index),'tokens',list(index)[:50])
