"""Preserve card IDs while repairing verb/noun homonyms and orthography."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
repairs=json.loads((root/'tools/verb-card-repairs.json').read_text())
changed=0;verb_count=0
for level in ['A1','A2','B1','B2','C1']:
 file=root/'dist/data'/f'{level}.json';words=json.loads(file.read_text())
 for word in words:
  patch=repairs.get(str(word['id']))
  if patch:
   if patch.get('removeVerbForms'):word.pop('verbForms',None)
   word.update({key:value for key,value in patch.items() if key!='removeVerbForms'})
   changed+=1
  verb_count+=word['pos']=='verb'
 file.write_text(json.dumps(words,ensure_ascii=False,separators=(',',':')))
print('Applied',changed,'card repairs;',verb_count,'verb cards; all IDs preserved.')
