#!/usr/bin/env python3
"""Optional preparation-only translation pass through Google's public endpoint.

No API call is made by the published site. Resume from an exact DE→AR cache;
retain existing reviewed Arabic and human-corpus examples. Respect HTTP errors
and rate limits, and validate batch line alignment before accepting any result.
"""
import argparse, datetime, importlib.util, json, random, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/'data-sources'
spec=importlib.util.spec_from_file_location('translation_helpers',ROOT/'tools/translate-examples.py')
helpers=importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)

def request(text):
    query=urllib.parse.urlencode({'client':'gtx','sl':'de','tl':'ar','dt':'t','q':text})
    url='https://translate.googleapis.com/translate_a/single?'+query
    req=urllib.request.Request(url,headers={'User-Agent':'WortExamplePreparation/1.0','Accept':'application/json'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=25) as response:
                payload=json.load(response)
            segments=payload[0]
            if not isinstance(segments,list):raise ValueError('Unexpected translation response')
            ar=''.join(item[0] or '' for item in segments if isinstance(item,list))
            de=''.join(item[1] or '' for item in segments if isinstance(item,list) and len(item)>1)
            return de,ar
        except urllib.error.HTTPError as error:
            if error.code==429:raise RuntimeError('Translation endpoint rate limit: stopped; cache is resumable') from error
            if error.code<500 or attempt==2:raise
            time.sleep(2*(attempt+1))
        except (TimeoutError,urllib.error.URLError):
            if attempt==2:raise
            time.sleep(2*(attempt+1))

def translate(batch):
    de,ar=request('\n'.join(batch))
    sources=de.replace('\r\n','\n').strip().split('\n')
    targets=ar.replace('\r\n','\n').strip().split('\n')
    if len(sources)==len(batch)==len(targets) and all(helpers.clean(a)==helpers.clean(b) for a,b in zip(batch,sources)):
        return [helpers.clean(value) for value in targets]
    if len(batch)==1:
        if helpers.clean(de)!=helpers.clean(batch[0]):raise ValueError('Source text changed in response')
        return [helpers.clean(ar)]
    # Never guess which translation belongs to which German example.
    result=[]
    for source in batch:
        time.sleep(.25)
        result.extend(translate([source]))
    return result

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=RAW/'ar-example-google-map.json')
    parser.add_argument('--benchmark',type=int,default=0)
    parser.add_argument('--limit',type=int,default=0)
    parser.add_argument('--batch-characters',type=int,default=1800)
    parser.add_argument('--delay',type=float,default=.35)
    args=parser.parse_args()
    started=time.perf_counter()
    texts,manual=helpers.collect()
    targets=set(texts)
    human=helpers.read(RAW/'ar-example-human-map.json',{})
    curated=helpers.read(RAW/'ar-example-curated-map.json',{})
    output={de:ar for de,ar in helpers.read(args.output,{}).items() if de in targets and isinstance(ar,str) and helpers.arabic(ar)}
    pending=[de for de in texts if de not in manual and de not in human and de not in curated and de not in output]
    if args.benchmark:
        pending=random.Random(72).sample(pending,min(args.benchmark,len(pending)))
    elif args.limit:pending=pending[:args.limit]
    print(json.dumps({'stage':'loaded','pending':len(pending),'resumed':len(output),'manual':len(manual),'human':len(human)},ensure_ascii=False),flush=True)
    batches=[];batch=[];length=0
    for de in pending:
        if batch and (length+len(de)+1>args.batch_characters or '\n' in de):
            batches.append(batch);batch=[];length=0
        batch.append(de);length+=len(de)+1
        if '\n' in de:batches.append(batch);batch=[];length=0
    if batch:batches.append(batch)
    issues=[];done=0
    try:
        for offset,batch in enumerate(batches):
            translated=translate(batch)
            for de,ar in zip(batch,translated):
                flags=helpers.quality_flags(de,ar)
                if ar and helpers.arabic(ar) and 'repetition' not in flags and 'word_repetition' not in flags:
                    output[de]=ar
                if flags:issues.append({'de':de,'ar':ar,'flags':flags})
                done+=1
            if args.benchmark:
                print(json.dumps({'stage':'sample','translations':[{'de':de,'ar':ar} for de,ar in zip(batch,translated)]},ensure_ascii=False),flush=True)
            else:helpers.write(args.output,output)
            print(json.dumps({'stage':'progress','processed':done,'total':len(pending),'cached':len(output),'issues':len(issues),'seconds':round(time.perf_counter()-started,2)},ensure_ascii=False),flush=True)
            if offset+1<len(batches):time.sleep(args.delay)
    finally:
        if not args.benchmark:
            helpers.write(args.output,output)
            helpers.write(RAW/'ar-example-google-issues.json',issues)
            helpers.write(RAW/'ar-example-google-report.json',{'provider':'Google Translate','endpoint':'https://translate.googleapis.com/translate_a/single','usage':'preparation only; no published runtime requests','generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'machineGenerated':True,'unique':len(texts),'manualPreserved':len(manual),'humanPreserved':len(human),'assistantCuratedPreserved':len(curated),'cached':len(output),'issues':len(issues),'seconds':round(time.perf_counter()-started,2)})

if __name__=='__main__':main()
