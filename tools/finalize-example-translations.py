#!/usr/bin/env python3
"""Combine reviewed/existing Arabic with the Google preparation cache only.

The earlier OPUS baseline is deliberately never read. Does not edit published
word JSON. Existing per-card Arabic must still be preserved during integration.
"""
import argparse, datetime, importlib.util, json, subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/'data-sources'
spec=importlib.util.spec_from_file_location('translation_helpers',ROOT/'tools/translate-examples.py')
helpers=importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--allow-incomplete',action='store_true')
    args=parser.parse_args()
    sentences,_=helpers.collect()
    # Read genuinely original Arabic from git, so rerunning after application
    # does not mislabel newly inserted machine translations as original text.
    existing={};original_counts={}
    for level in ['A1','A2','B1','B2','C1']:
        rows=json.loads(subprocess.check_output(['git','show',f'HEAD:dist/data/{level}.json'],cwd=ROOT,text=True))
        original_counts[level]=0
        for word in rows:
            for example in word.get('examples',[]):
                if example.get('ar','').strip() and example.get('translationMethod') not in ['machine','assistant-curated']:
                    existing[example['de'].strip()]=example['ar']
                    original_counts[level]+=1
    targets=set(sentences)
    curated=helpers.read(RAW/'ar-example-curated-map.json',{})
    google=helpers.read(RAW/'ar-example-google-map.json',{})
    output={};provenance={}
    providers=[('google-translate',google),('assistant-curated',curated),('existing-arabic',existing)]
    for provider,mapping in providers:
        for de,ar in mapping.items():
            if de in targets and isinstance(ar,str) and ar.strip() and helpers.arabic(ar):
                output[de]=ar.strip();provenance[de]=provider
    missing=[de for de in sentences if de not in output]
    counts={provider:sum(value==provider for value in provenance.values()) for provider,_ in providers}
    level_coverage={}
    total_occurrences=0
    for level in ['A1','A2','B1','B2','C1']:
        examples=[example for word in helpers.read(ROOT/'dist/data'/f'{level}.json',[]) for example in word.get('examples',[])]
        total_occurrences+=len(examples)
        level_coverage[level]={'examples':len(examples),'covered':sum(example.get('de','').strip() in output for example in examples),'existingArabicPreserved':original_counts[level]}
    metadata={
        'schemaVersion':1,
        'preparedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'sourceLanguage':'de','targetLanguage':'ar',
        'precedence':['existing-arabic','assistant-curated','google-translate'],
        'coverage':{'uniqueGermanSentences':len(targets),'coveredUnique':len(output),'missingUnique':len(missing),'exampleOccurrences':total_occurrences,'levels':level_coverage},
        'uniqueCountsByProvider':counts,
        'providers':{
            'existing-arabic':{'kind':'existing','description':'Arabic already present in the word data. Preserve original per-example text during integration.'},
            'assistant-curated':{'kind':'assistant-curated','file':'ar-example-curated-map.json','description':'Translations written or corrected by the assistant. This label does not claim human review.'},
            'google-translate':{'kind':'machine','provider':'Google Translate','endpoint':'https://translate.googleapis.com/translate_a/single','method':'One-off preparation of public German example sentences; exact source/target line alignment checked. No calls from the published site.','runtimeRequests':False,'humanReviewed':False}
        },
        'preserveOriginalExampleProvenance':True,
        'sourceLicenseHandling':'Keep the existing German example source, sourceUrl and license fields. Translation-provider attribution does not replace those source licenses.',
        'qualityStatus':'Google machine translations with targeted assistant corrections. Remaining machine translations have not all been reviewed for semantic accuracy.',
        'opusBaselineIncluded':False,
        'mapFile':'ar-example-final-map.json','provenanceFile':'ar-example-final-provenance.json'
    }
    helpers.write(RAW/'ar-example-final-map.json',output)
    helpers.write(RAW/'ar-example-final-provenance.json',provenance)
    helpers.write(RAW/'ar-example-final-missing.json',missing)
    helpers.write(RAW/'ar-example-source-metadata.json',metadata)
    print(json.dumps({'unique':len(targets),'covered':len(output),'missing':len(missing),'providers':counts,'occurrences':total_occurrences},ensure_ascii=False))
    if missing and not args.allow_incomplete:raise SystemExit(2)

if __name__=='__main__':main()
