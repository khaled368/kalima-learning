#!/usr/bin/env python3
"""Apply the contextual Arabic catalogue, preserving vocabulary and sources.

Import a complete fresh set with import-contextual-translations.py.
Apply after regenerating vocabulary:
  python tools/apply-example-translations.py
Verify exact source and original Arabic preservation:
  python tools/apply-example-translations.py --check-only

The former --prepare-catalog machine-translation pipeline has been removed.
"""
import argparse
import collections
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']
CATALOGUE = ROOT / 'tools/translations/example-ar.json'
TRANSLATION_KEYS = {'ar', 'translationMethod', 'translationProvider'}
GENERATED_METHODS = {'machine', 'assistant-curated'}
BASELINE = '42508d99d5fb6d16f9eb4941d2a2b1095907d397'
CATALOGUE_BASELINE = BASELINE
METADATA = ROOT / 'dist/data/example-translations.json'
REPAIRED_SOURCE = 'Wort — مثال تعليمي مُعدّ للموقع'
REPAIRED_LICENSE = 'مثال تعليمي أصلي صيغ بمساعدة الذكاء الاصطناعي للموقع؛ لا يُنسب إلى المصدر السابق.'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write(path, value):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    temporary.replace(path)


def valid_ar(value):
    return isinstance(value, str) and bool(value.strip()) and bool(re.search(r'[\u0621-\u064a]', value))


def files():
    return [(level, ROOT / 'dist/data' / f'{level}.json') for level in LEVELS]


def baseline_file(commit, path):
    result = subprocess.run(['git', 'show', f'{commit}:{path}'], cwd=ROOT,
                            text=True, capture_output=True, check=True)
    return json.loads(result.stdout)


def read_repairs(path):
    repairs = read(path)
    original = baseline_file(CATALOGUE_BASELINE, 'tools/translations/example-ar.json')
    if not isinstance(repairs, dict) or not repairs:
        raise ValueError('Source-repair map must be a nonempty object keyed by exact old German')
    for old_de, repair in repairs.items():
        if old_de not in original or original[old_de]['provider'] == 'existing':
            raise ValueError('Source repair is unknown or would change preserved original Arabic: ' + old_de)
        if (not isinstance(repair, dict) or not isinstance(repair.get('de'), str)
                or not repair['de'].strip() or repair['de'] != repair['de'].strip()
                or repair['de'] == old_de or not valid_ar(repair.get('ar'))
                or not isinstance(repair.get('reason'), str) or not repair['reason'].strip()):
            raise ValueError('Invalid exact old/new German, Arabic or reason in repair: ' + old_de)
        if (repair['de'] in original and repair['de'] not in repairs
                and original[repair['de']]['provider'] in {'existing', 'assistant'}):
            raise ValueError('Repair would collide with preserved authored/original Arabic: ' + repair['de'])
    by_new = {}
    for repair in repairs.values():
        if repair['de'] in by_new and by_new[repair['de']] != repair['ar']:
            raise ValueError('Converging repaired German examples have different Arabic: ' + repair['de'])
        by_new[repair['de']] = repair['ar']
    return repairs


def active_repairs():
    metadata = read(METADATA)
    revision = metadata.get('sourceExampleRevisions')
    if not revision:
        return {}
    path = ROOT / revision['file']
    if hashlib.sha256(path.read_bytes()).hexdigest() != revision['sha256']:
        raise ValueError('Applied source-repair map has changed; explicit reapplication is required')
    return read_repairs(path)


def repaired_source(prior, repair):
    return {
        'de': repair['de'], 'source': REPAIRED_SOURCE, 'license': REPAIRED_LICENSE,
        'generated': True,
        'originalSource': {k: v for k, v in prior.items() if k not in TRANSLATION_KEYS},
        'exampleRevisionMethod': 'assistant-authored-source-repair',
        'revisionReason': repair['reason'],
    }


def check_catalogue(catalogue, repairs=None):
    repairs = repairs or {}
    original = baseline_file(CATALOGUE_BASELINE, 'tools/translations/example-ar.json')
    expected_keys = {repairs[de]['de'] if de in repairs else de for de in original}
    if set(catalogue) != expected_keys:
        raise ValueError('Catalogue keys differ from baseline plus the explicit source-repair whitelist')
    for de, entry in catalogue.items():
        if not valid_ar(entry.get('ar')) or entry.get('provider') not in {'assistant', 'existing'}:
            raise ValueError('Catalogue contains missing Arabic or non-contextual provenance: ' + de)
        old = original.get(de)
        if old is None:
            continue
        if old['provider'] in {'assistant', 'existing'} and entry != old:
            raise ValueError('Existing authored/original catalogue entry changed: ' + de)
        if old['provider'] == 'Google Translate' and entry['provider'] != 'assistant':
            raise ValueError('Fresh replacement must carry assistant provenance: ' + de)
    counts = collections.Counter(entry['provider'] for entry in catalogue.values())
    for repair in repairs.values():
        if catalogue[repair['de']] != {'ar': repair['ar'], 'provider': 'assistant'}:
            raise ValueError('Catalogue differs from the explicit source repair: ' + repair['de'])
    if counts != {'assistant': len(expected_keys) - 157, 'existing': 157}:
        raise ValueError('Incorrect catalogue provider totals: ' + str(counts))


def check(catalogue, repairs=None):
    repairs = active_repairs() if repairs is None else repairs
    check_catalogue(catalogue, repairs)
    counts = collections.Counter()
    errors = []

    def error(message):
        if len(errors) < 20:
            errors.append(message)

    unique = set()
    for level, path in files():
        current = read(path)
        old = baseline_file(BASELINE, f'dist/data/{level}.json')
        if len(current) != len(old):
            error(level + ': word count changed')
        for index, (word, original) in enumerate(zip(current, old)):
            identity = str(word.get('id', level + ':' + str(index)))
            if {k: v for k, v in word.items() if k != 'examples'} != {k: v for k, v in original.items() if k != 'examples'}:
                error(identity + ': card metadata, order, headword or Arabic gloss changed')
            examples = word.get('examples', [])
            previous = original.get('examples', [])
            if len(examples) != len(previous):
                error(identity + ': example count changed')
            for i, (example, prior) in enumerate(zip(examples, previous)):
                counts['examples'] += 1
                key = example.get('de', '').strip()
                unique.add(key)
                label = identity + ':example-' + str(i)
                old_de = prior.get('de', '').strip()
                expected_source = (repaired_source(prior, repairs[old_de]) if old_de in repairs
                                   else {k: v for k, v in prior.items() if k not in TRANSLATION_KEYS})
                if expected_source != {k: v for k, v in example.items() if k not in TRANSLATION_KEYS}:
                    error(label + ': German text or original source provenance changed')
                if old_de in repairs:
                    counts['sourceRepairedExamples'] += 1
                if not valid_ar(example.get('ar')):
                    error(label + ': missing Arabic')
                if example.get('translationMethod') == 'machine' or example.get('translationProvider') == 'Google Translate':
                    error(label + ': machine/Google translation remains')
                if isinstance(prior.get('ar'), str) and prior['ar'].strip() and prior.get('translationMethod') not in GENERATED_METHODS:
                    counts['originalArabicPreserved'] += 1
                    if {k: prior.get(k) for k in TRANSLATION_KEYS} != {k: example.get(k) for k in TRANSLATION_KEYS}:
                        error(label + ': original Arabic or translation metadata changed')
                else:
                    entry = catalogue.get(key)
                    if not entry:
                        error(label + ': no catalogue entry')
                        continue
                    if example.get('ar') != entry['ar']:
                        error(label + ': Arabic differs from catalogue')
                    if entry['provider'] != 'assistant' or example.get('translationMethod') != 'assistant-curated' or example.get('translationProvider') != 'assistant':
                        error(label + ': incorrect contextual assistant provenance')
                if example.get('translationMethod'):
                    counts[example['translationMethod']] += 1
    if counts['examples'] != 17584 or unique != set(catalogue):
        error('Expected 17,584 example occurrences and exact contextual catalogue coverage')
    if counts['originalArabicPreserved'] != 157 or counts['assistant-curated'] != 17427:
        error('Expected 157 original Arabic occurrences and 17,427 assistant occurrences')
    if errors:
        raise ValueError(json.dumps({'validationErrors': errors}, ensure_ascii=False))
    print(json.dumps({'stage': 'checked', 'unique': len(unique), **counts,
                      'googleExamples': 0, 'machineExamples': 0,
                      'sourceRepairWhitelistEntries': len(repairs),
                      'sourceAndCardPreservation': 'exact against ' + BASELINE + (' except the explicit source-repair whitelist' if repairs else ''),
                      'originalArabicPreservation': 'exact against ' + BASELINE}, ensure_ascii=False))


def apply(catalogue, repair_path=None):
    repairs = active_repairs() if repair_path is None else read_repairs(repair_path)
    if repair_path is None:
        check_catalogue(catalogue, repairs)
    else:
        # Check the initial catalogue before adding only the reviewed whitelist.
        check_catalogue(catalogue, active_repairs())
        catalogue = {de: entry for de, entry in catalogue.items() if de not in repairs}
        for repair in repairs.values():
            catalogue[repair['de']] = {'ar': repair['ar'], 'provider': 'assistant'}
        check_catalogue(catalogue, repairs)
    filled = refreshed = 0
    pending = []
    for level, path in files():
        data = read(path)
        old = baseline_file(BASELINE, f'dist/data/{level}.json')
        if len(data) != len(old):
            raise ValueError(level + ': card count changed before application')
        for word, prior_word in zip(data, old):
            if {k: v for k, v in word.items() if k != 'examples'} != {k: v for k, v in prior_word.items() if k != 'examples'}:
                raise ValueError(str(word.get('id')) + ': card fields changed before application')
            if len(word.get('examples', [])) != len(prior_word.get('examples', [])):
                raise ValueError(str(word.get('id')) + ': example count changed before application')
            for example, prior in zip(word.get('examples', []), prior_word.get('examples', [])):
                has_ar = isinstance(example.get('ar'), str) and bool(example['ar'].strip())
                if has_ar and example.get('translationMethod') not in GENERATED_METHODS:
                    continue
                before = {k: example.get(k) for k in TRANSLATION_KEYS}
                old_de = prior.get('de', '').strip()
                if old_de in repairs:
                    for field in list(example):
                        if field not in TRANSLATION_KEYS:
                            del example[field]
                    example.update(repaired_source(prior, repairs[old_de]))
                key = example.get('de', '').strip()
                entry = catalogue.get(key)
                if not entry or not valid_ar(entry.get('ar')) or entry.get('provider') != 'assistant':
                    raise ValueError('No valid contextual assistant translation: ' + key)
                example['ar'] = entry['ar']
                example['translationMethod'] = 'assistant-curated'
                example['translationProvider'] = 'assistant'
                if not has_ar:
                    filled += 1
                elif before != {k: example.get(k) for k in TRANSLATION_KEYS}:
                    refreshed += 1
        pending.append((path, data))
    for path, data in pending:
        write(path, data)
    if repairs:
        metadata = read(METADATA)
        if repair_path is not None:
            metadata['sourceExampleRevisions'] = {
                'file': str(repair_path.resolve().relative_to(ROOT)),
                'sha256': hashlib.sha256(repair_path.read_bytes()).hexdigest(),
                'method': 'assistant-authored-source-repair',
                'repairedUniqueSources': len(repairs), 'humanReviewed': False,
                'source': REPAIRED_SOURCE,
                'originalProvenance': 'Exact old German/source/licence fields are preserved under originalSource.',
            }
        unique = {ex['de'].strip() for _, data in pending for word in data for ex in word.get('examples', [])}
        metadata['coverage']['uniqueGermanSentences'] = len(unique)
        metadata['coverage']['coveredUnique'] = len(unique)
        metadata['uniqueCountsByProvider'] = dict(collections.Counter(entry['provider'] for entry in catalogue.values()))
        metadata['sourceExampleRevisions']['repairedOccurrences'] = sum(
            'originalSource' in ex for _, data in pending for word in data for ex in word.get('examples', []))
        metadata['sourceExampleRevisions']['repairedExamples'] = metadata['sourceExampleRevisions']['repairedOccurrences']
        write(CATALOGUE, catalogue)
        write(METADATA, metadata)
    print(json.dumps({'stage': 'applied', 'addedArabicExamples': filled,
                      'refreshedGeneratedExamples': refreshed}, ensure_ascii=False))
    check(catalogue, repairs)


def main():
    global BASELINE
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline', default=BASELINE, help='Commit used to verify exact card/source/original Arabic preservation')
    parser.add_argument('--check-only', action='store_true')
    parser.add_argument('--apply-source-repairs', type=Path,
                        help='Explicitly activate an approved exact old/new source-example whitelist')
    args = parser.parse_args()
    BASELINE = args.baseline
    try:
        if args.check_only and args.apply_source_repairs:
            raise ValueError('--check-only cannot activate source repairs')
        catalogue = read(CATALOGUE)
        if args.check_only:
            check(catalogue)
        else:
            apply(catalogue, args.apply_source_repairs)
    except (OSError, ValueError, KeyError, TypeError, subprocess.CalledProcessError) as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(2)


if __name__ == '__main__':
    main()
