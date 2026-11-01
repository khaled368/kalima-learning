#!/usr/bin/env python3
"""Apply the tracked Arabic example catalogue without changing German sources.

Prepare the catalogue once from the reviewed final maps:
  python tools/apply-example-translations.py --prepare-catalog
Apply after regenerating vocabulary:
  python tools/apply-example-translations.py
Verify coverage and preservation against the preceding published version:
  python tools/apply-example-translations.py --check-only
"""
import argparse, collections, json, re, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/'data-sources'
LEVELS=['A1','A2','B1','B2','C1']
CATALOGUE=ROOT/'tools/translations/example-ar.json'
TRANSLATION_KEYS={'ar','translationMethod','translationProvider'}
GENERATED_METHODS={'machine','assistant-curated'}
BASELINE='141f3898e87be684f7bc7a49590f7d45d01909bf'

def read(path):return json.loads(path.read_text())
def write(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    temp=path.with_suffix(path.suffix+'.tmp')
    temp.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':')))
    temp.replace(path)
def valid_ar(value):return isinstance(value,str) and bool(value.strip()) and bool(re.search(r'[\u0621-\u064a]',value))
def files():return [(level,ROOT/'dist/data'/f'{level}.json') for level in LEVELS]

def baseline(level):
    result=subprocess.run(['git','show',f'{BASELINE}:dist/data/{level}.json'],cwd=ROOT,text=True,capture_output=True,check=True)
    return json.loads(result.stdout)

def prepare_catalogue():
    translations=read(RAW/'ar-example-final-map.json')
    provenance=read(RAW/'ar-example-final-provenance.json')
    targets={ex['de'].strip() for _,path in files() for word in read(path) for ex in word.get('examples',[])}
    if targets-set(translations):raise ValueError(f'Final translations incomplete: {len(targets-set(translations))} missing')
    provider_names={'google-translate':'Google Translate','assistant-curated':'assistant','existing-arabic':'existing'}
    catalogue={}
    for de in sorted(targets):
        ar=translations[de]
        if not valid_ar(ar):raise ValueError('Final translation has no Arabic: '+de)
        source=provenance.get(de)
        if source not in provider_names:raise ValueError('Unknown final translation provenance: '+str(source))
        catalogue[de]={'ar':ar,'provider':provider_names[source]}
    write(CATALOGUE,catalogue)
    print(json.dumps({'stage':'catalogue-prepared','path':str(CATALOGUE.relative_to(ROOT)),'unique':len(catalogue),'providers':dict(collections.Counter(row['provider'] for row in catalogue.values()))}))

def check(catalogue):
    counts=collections.Counter();errors=[]
    def error(message):
        if len(errors)<20:errors.append(message)
    unique=set()
    for level,path in files():
        current=read(path);old=baseline(level)
        if len(current)!=len(old):error(level+': word count changed')
        for index,(word,original) in enumerate(zip(current,old)):
            identity=str(word.get('id',level+':'+str(index)))
            if word.get('id')!=original.get('id'):error(identity+': card identity/order changed')
            if word.get('german')!=original.get('german'):error(identity+': German headword changed')
            examples=word.get('examples',[]);previous=original.get('examples',[])
            if len(examples)!=len(previous):error(identity+': example count changed')
            for i,(example,prior) in enumerate(zip(examples,previous)):
                counts['examples']+=1
                de=example.get('de','');key=de.strip();unique.add(key)
                label=identity+':example-'+str(i)
                original_source={k:v for k,v in prior.items() if k not in TRANSLATION_KEYS}
                current_source={k:v for k,v in example.items() if k not in TRANSLATION_KEYS}
                if original_source!=current_source:error(label+': German text or original provenance changed')
                if not valid_ar(example.get('ar')):error(label+': missing Arabic')
                if isinstance(prior.get('ar'),str) and prior['ar'].strip() and prior.get('translationMethod') not in GENERATED_METHODS:
                    counts['originalArabicPreserved']+=1
                    if example.get('ar')!=prior['ar']:error(label+': original Arabic changed')
                    for field in ['translationMethod','translationProvider']:
                        if prior.get(field)!=example.get(field):error(label+': original translation metadata changed')
                else:
                    entry=catalogue.get(key)
                    if not entry:error(label+': no catalogue entry');continue
                    if example.get('ar')!=entry['ar']:error(label+': Arabic differs from catalogue')
                    if entry['provider']=='Google Translate':
                        if example.get('translationMethod')!='machine' or example.get('translationProvider')!='Google Translate':error(label+': incorrect Google provenance')
                    elif entry['provider']=='assistant':
                        if example.get('translationMethod')!='assistant-curated' or example.get('translationProvider')!='assistant':error(label+': incorrect assistant provenance')
                    elif entry['provider']!='existing':error(label+': unknown provider')
                if example.get('translationMethod'):counts[example['translationMethod']]+=1
    if counts['examples']!=17584:error('Expected 17,584 examples; found '+str(counts['examples']))
    if len(unique)!=14560:error('Expected 14,560 unique German sentences; found '+str(len(unique)))
    if errors:raise ValueError(json.dumps({'validationErrors':errors},ensure_ascii=False))
    print(json.dumps({'stage':'checked','unique':len(unique),**counts,'sourcePreservation':'exact against '+BASELINE,'originalArabicPreservation':'exact against '+BASELINE},ensure_ascii=False))

def apply(catalogue):
    filled=0;refreshed=0
    # Validate every planned value before writing any published file.
    pending=[]
    for _,path in files():
        data=read(path)
        for word in data:
            for example in word.get('examples',[]):
                has_ar=isinstance(example.get('ar'),str) and bool(example['ar'].strip())
                if has_ar and example.get('translationMethod') not in GENERATED_METHODS:continue
                before={k:example.get(k) for k in TRANSLATION_KEYS}
                key=example.get('de','').strip();entry=catalogue.get(key)
                if not entry or not valid_ar(entry.get('ar')):raise ValueError('No valid catalogue translation: '+key)
                if entry.get('provider') not in ['Google Translate','assistant','existing']:raise ValueError('Unknown provider: '+str(entry.get('provider')))
                example['ar']=entry['ar']
                if entry['provider']=='Google Translate':
                    example['translationMethod']='machine';example['translationProvider']='Google Translate'
                elif entry['provider']=='assistant':
                    example['translationMethod']='assistant-curated';example['translationProvider']='assistant'
                if not has_ar:filled+=1
                elif before!={k:example.get(k) for k in TRANSLATION_KEYS}:refreshed+=1
        pending.append((path,data))
    for path,data in pending:write(path,data)
    print(json.dumps({'stage':'applied','addedArabicExamples':filled,'refreshedGeneratedExamples':refreshed},ensure_ascii=False))
    check(catalogue)

def main():
    global BASELINE
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline',default=BASELINE,help='Source commit used to verify unchanged German examples and existing Arabic')
    group=parser.add_mutually_exclusive_group()
    group.add_argument('--prepare-catalog',action='store_true')
    group.add_argument('--check-only',action='store_true')
    args=parser.parse_args()
    BASELINE=args.baseline
    try:
        if args.prepare_catalog:prepare_catalogue();return
        catalogue=read(CATALOGUE)
        if args.check_only:check(catalogue)
        else:apply(catalogue)
    except (ValueError,KeyError,FileNotFoundError,subprocess.CalledProcessError) as error:
        print(str(error),file=sys.stderr);raise SystemExit(2)

if __name__=='__main__':main()
