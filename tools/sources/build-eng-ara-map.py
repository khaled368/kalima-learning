import tarfile,xml.etree.ElementTree as ET,json,re,pathlib
p=pathlib.Path(__file__).parent
with tarfile.open(p/'freedict-eng-ara.src.tar.xz') as t:
 data=t.extractfile('eng-ara/eng-ara.tei').read()
 copying=t.extractfile('eng-ara/COPYING').read()
(p/'FREEDICT-COPYING.txt').write_bytes(copying)
root=ET.fromstring(data);ns={'t':'http://www.tei-c.org/ns/1.0'}
lookup={}
for e in root.findall('.//t:entry',ns):
 orth=e.findtext('./t:form/t:orth',namespaces=ns)
 if not orth:continue
 q=[' '.join(''.join(q.itertext()).split()) for q in e.findall('.//t:cit[@type="trans"]/t:quote',ns)]
 q=[s for s in q if re.search('[\u0600-\u06ff]',s)]
 if not q:continue
 key=orth.strip().lower()
 dst=lookup.setdefault(key,[])
 for s in q:
  if s not in dst:dst.append(s)
(p/'eng-ara-map.json').write_text(json.dumps(lookup,ensure_ascii=False,separators=(',',':')))
meta={'title':'English-Arabic FreeDict Dictionary','version':'0.6.3','headwords_in_original':87424,'normalized_english_keys':len(lookup),'authors':'Arabeyes.org and FreeDict contributors','license':'GPL-2.0-or-later','source':'https://download.freedict.org/dictionaries/eng-ara/0.6.3/freedict-eng-ara-0.6.3.src.tar.xz','upstream':'http://www.arabeyes.org/project.php?proj=Wordlist','method':'English headword exact lowercased lookup. Arabic list retains source sense order; sense ambiguity must be reviewed when pivoting from German.'}
(p/'eng-ara-source.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
print(json.dumps(meta,ensure_ascii=False));print('samples',json.dumps({k:lookup.get(k) for k in ['apple','book','hard','house','to go','go']},ensure_ascii=False))
