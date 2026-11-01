#!/usr/bin/env python3
"""Batch German→Arabic examples locally with OPUS-MT/CTranslate2.

This preparation tool does not change published word JSON. Existing Arabic examples
remain authoritative; exact parallel-corpus matches outrank machine output.
"""
import argparse, collections, datetime, json, math, os, re, sys, time, unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/'data-sources'

def read(path, fallback):
    try:return json.loads(path.read_text())
    except (FileNotFoundError,json.JSONDecodeError):return fallback

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp=path.with_suffix(path.suffix+'.tmp')
    temp.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':')))
    temp.replace(path)

def clean(text):return unicodedata.normalize('NFC',str(text)).strip()
def arabic(text):return bool(re.search(r'[\u0621-\u064a\u066e-\u06d3]',text))
def words(text):return re.findall(r'\w+',text,re.U)

def quality_flags(source,target):
    flags=[]
    if not target or not arabic(target):flags.append('no_arabic')
    if '<unk>' in target or '⁇' in target:flags.append('unknown_piece')
    if len(source)>30 and len(target)<max(3,len(source)*.08):flags.append('extremely_short')
    if len(target)>max(160,len(source)*6):flags.append('extremely_long')
    tokens=words(target)
    counts=collections.Counter(tokens)
    if len(tokens)>=5 and max(counts.values(),default=0)>=max(4,len(tokens)*.65):
        flags.append('word_repetition')
    if len(tokens)>=3 and len(counts)==1 and len(words(source))>=3:
        flags.append('word_repetition')
    if len(tokens)>=12:
        triples=collections.Counter(tuple(tokens[i:i+3]) for i in range(len(tokens)-2))
        if max(triples.values(),default=0)>=4:flags.append('repetition')
    return flags

def collect():
    examples={};manual={}
    for level in ['A1','A2','B1','B2','C1']:
        for word in read(ROOT/'dist/data'/f'{level}.json',[]):
            for ex in word.get('examples',[]):
                de=ex.get('de','').strip()
                if not de:continue
                examples[de]=True
                if ex.get('ar','').strip():manual[de]=ex['ar'].strip()
    return list(examples),manual

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model',type=Path,default=RAW/'de-ar-ct2')
    parser.add_argument('--architecture',choices=['opus','nllb'],default='opus')
    parser.add_argument('--runtime',type=Path,default=RAW/'mt-python')
    parser.add_argument('--output',type=Path,default=RAW/'ar-example-map.json')
    parser.add_argument('--human',type=Path,default=RAW/'ar-example-human-map.json')
    parser.add_argument('--curated',type=Path,default=RAW/'ar-example-curated-map.json')
    parser.add_argument('--batch-size',type=int,default=64)
    parser.add_argument('--threads',type=int,default=min(3,os.cpu_count() or 1))
    parser.add_argument('--beam-size',type=int,default=4)
    parser.add_argument('--benchmark',type=int,default=0)
    parser.add_argument('--limit',type=int,default=0)
    args=parser.parse_args()
    sys.path.insert(0,str(args.runtime))
    import ctranslate2
    import sentencepiece as spm
    started=time.perf_counter()
    texts,manual=collect();targets=set(texts)
    output={de:ar for de,ar in read(args.output,{}).items() if de in targets and isinstance(ar,str) and ar.strip() and arabic(ar)}
    curated={de:ar.strip() for de,ar in read(args.curated,{}).items() if de in targets and isinstance(ar,str) and ar.strip() and arabic(ar)}
    output.update(curated)
    output.update(manual)
    human={}
    def merge_human():
        nonlocal human
        human={de:ar.strip() for de,ar in read(args.human,{}).items() if de in targets and isinstance(ar,str) and ar.strip() and arabic(ar)}
        for de,ar in human.items():
            if de not in manual and de not in curated:output[de]=ar
    merge_human()
    source_file=args.model/('sentencepiece.bpe.model' if args.architecture=='nllb' else 'source.spm')
    target_file=source_file if args.architecture=='nllb' else args.model/'target.spm'
    if not source_file.exists() or not target_file.exists():
        raise SystemExit('Missing source.spm or target.spm in '+str(args.model))
    source=spm.SentencePieceProcessor(model_file=str(source_file))
    target=spm.SentencePieceProcessor(model_file=str(target_file))
    translator=ctranslate2.Translator(str(args.model),device='cpu',compute_type='int8',inter_threads=1,intra_threads=args.threads)
    pending=[de for de in texts if de not in output]
    # This converted Marian model explicitly has add_source_eos=false. Its
    # encoder still needs the trained sentence terminator supplied by us.
    def encode(text):
        pieces=source.encode(text,out_type=str)
        return ['deu_Latn']+pieces+['</s>'] if args.architecture=='nllb' else pieces+['</s>']
    encoded={de:encode(de) for de in pending}
    pending.sort(key=lambda de:(len(encoded[de]),len(de)))
    print(json.dumps({'stage':'loaded','unique':len(texts),'manual':len(manual),'human':len(human),'resumed':len(output),'pending':len(pending),'threads':args.threads,'model':str(args.model)},ensure_ascii=False),flush=True)
    def translate(batch,beam=None):
        options={'target_prefix':[['arb_Arab'] for _ in batch]} if args.architecture=='nllb' else {}
        result=translator.translate_batch([encoded.get(de) or encode(de) for de in batch],beam_size=beam or args.beam_size,max_decoding_length=192,replace_unknowns=True,**options)
        return [clean(target.decode([p for p in item.hypotheses[0] if p not in ['</s>','<s>','<pad>','arb_Arab']])) for item in result]
    if args.benchmark:
        count=min(args.benchmark,len(pending));sample=[pending[round(i*(len(pending)-1)/max(1,count-1))] for i in range(count)]
        translate(['Das ist ein deutsches Beispiel.'])
        bench=time.perf_counter();translations=translate(sample);seconds=time.perf_counter()-bench
        print(json.dumps({'stage':'benchmark','sentences':count,'seconds':seconds,'per_second':count/seconds,'estimated_remaining_minutes':len(pending)/max(.001,count/seconds)/60,'samples':[{'de':de,'ar':ar,'flags':quality_flags(de,ar)} for de,ar in zip(sample,translations)][:12]},ensure_ascii=False),flush=True)
        return
    if args.limit:pending=pending[:args.limit]
    issues=[issue for issue in read(RAW/'ar-example-translation-issues.json',[]) if issue.get('de') in output and issue.get('de') not in manual and issue.get('de') not in human and issue.get('de') not in curated]
    processed=0
    for offset in range(0,len(pending),args.batch_size):
        merge_human()
        batch=[de for de in pending[offset:offset+args.batch_size] if de not in output]
        if not batch:continue
        translated=translate(batch)
        for de,ar in zip(batch,translated):
            flags=quality_flags(de,ar)
            if flags:
                try:
                    retried=translate([de],beam=4)[0]
                    if len(quality_flags(de,retried))<len(flags):ar=retried;flags=quality_flags(de,ar)
                except Exception as error:flags.append('retry_error:'+str(error))
            if ar and arabic(ar):output[de]=ar
            if flags:issues.append({'de':de,'ar':ar,'flags':flags})
            processed+=1
        if offset//args.batch_size%4==0 or offset+args.batch_size>=len(pending):
            write(args.output,output)
            elapsed=time.perf_counter()-started
            print(json.dumps({'stage':'progress','translated':processed,'covered':len(output),'total':len(texts),'elapsed_seconds':round(elapsed,2),'issues':len(issues)},ensure_ascii=False),flush=True)
    merge_human();output.update(manual);write(args.output,output)
    issues=[issue for issue in issues if issue.get('de') not in manual and issue.get('de') not in human and issue.get('de') not in curated]
    machine=[de for de in output if de not in manual and de not in human and de not in curated]
    missing=[de for de in texts if de not in output]
    write(RAW/'ar-example-machine-keys.json',machine)
    write(RAW/'ar-example-translation-issues.json',issues)
    write(RAW/'ar-example-untranslated.json',missing)
    model_metadata={'model':'osa911/nllb-200-distilled-600M-ct2-int8','baseModel':'facebook/nllb-200-distilled-600M','license':'CC-BY-NC-4.0 model card'} if args.architecture=='nllb' else {'model':'manancode/opus-mt-de-ar-ctranslate2-android','baseModel':'Helsinki-NLP/opus-mt-de-ar','license':'Apache-2.0 model card'}
    report={**model_metadata,'engine':'CTranslate2 int8 CPU','generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'unique':len(texts),'manual':len(manual),'human':len(human),'assistantCurated':len(set(curated)-set(manual)),'machine':len(machine),'covered':len(output),'missing':len(missing),'issues':len(issues),'elapsedSeconds':round(time.perf_counter()-started,2),'qualityStatus':'Machine-generated translations with automated sanity checks and targeted assistant corrections. Most translations have not had semantic review.'}
    write(RAW/'ar-example-translation-report.json',report)
    print(json.dumps({'stage':'complete',**report},ensure_ascii=False),flush=True)
    if missing and not args.limit:raise SystemExit(2)

if __name__=='__main__':main()
