#!/usr/bin/env python3
"""Import complete contextual Arabic translations from six local part files.

Requires all part-N.input.jsonl and part-N.output.tsv pairs. Each output is a
local row ID, a tab, and newly authored Arabic. There are no network calls and
no fallback that re-labels old machine text when fresh outputs are missing.

  python tools/import-contextual-translations.py --input-dir /path/to/parts
  python tools/apply-example-translations.py
"""
import argparse
import collections
import hashlib
import importlib.util
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE = '42508d99d5fb6d16f9eb4941d2a2b1095907d397'
CATALOGUE = ROOT / 'tools/translations/example-ar.json'
METADATA = ROOT / 'dist/data/example-translations.json'
LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']
ARABIC_NOTE = 'ترجمات عربية صيغت بمساعدة الذكاء الاصطناعي مع مراعاة سياق الأمثلة؛ ليست ترجمة بشرية معتمدة'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write(path, value):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    temporary.replace(path)


def valid_ar(value):
    return (isinstance(value, str) and bool(value.strip())
            and bool(re.search(r'[\u0621-\u064a]', value))
            and not re.search(r'[\x00-\x1f\x7f]', value))


def original_catalogue():
    result = subprocess.run(
        ['git', 'show', BASELINE + ':tools/translations/example-ar.json'],
        cwd=ROOT, text=True, capture_output=True, check=True)
    catalogue = json.loads(result.stdout)
    providers = collections.Counter(row['provider'] for row in catalogue.values())
    if providers != {'Google Translate': 14069, 'assistant': 334, 'existing': 157}:
        raise ValueError('Unexpected baseline catalogue coverage: ' + str(providers))
    return catalogue


def applied_source_repairs():
    """Keep an explicitly activated source whitelist when re-importing Arabic."""
    if not METADATA.exists():
        return {}, None
    revision = read(METADATA).get('sourceExampleRevisions')
    if not revision:
        return {}, None
    specification = importlib.util.spec_from_file_location(
        'wort_apply_examples', ROOT / 'tools/apply-example-translations.py')
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    return module.active_repairs(), revision


def prepare(input_dir):
    original = original_catalogue()
    targets = {de for de, entry in original.items() if entry['provider'] == 'Google Translate'}
    replacements = {}
    artifacts = []
    for part in range(1, 7):
        input_path = input_dir / f'part-{part}.input.jsonl'
        output_path = input_dir / f'part-{part}.output.tsv'
        inputs = [json.loads(line) for line in input_path.read_text(encoding='utf-8').splitlines()]
        if not inputs or [row.get('n') for row in inputs] != list(range(len(inputs))):
            raise ValueError(f'Part {part}: input IDs must be the exact ordered local range')
        outputs = {}
        for line_number, line in enumerate(output_path.read_text(encoding='utf-8').splitlines(), 1):
            fields = line.split('\t')
            if len(fields) != 2 or not fields[0].isdecimal():
                raise ValueError(f'Part {part}, output line {line_number}: expected ID TAB Arabic')
            n, ar = int(fields[0]), fields[1]
            if n in outputs:
                raise ValueError(f'Part {part}: duplicate output ID {n}')
            if not valid_ar(ar):
                raise ValueError(f'Part {part}, output {n}: empty, invalid or non-Arabic translation')
            outputs[n] = ar
        if set(outputs) != set(range(len(inputs))):
            raise ValueError(f'Part {part}: outputs must cover every input ID exactly once')
        changed = 0
        for row in inputs:
            de = row.get('de')
            if de not in targets:
                raise ValueError(f'Part {part}: input is not an exact baseline replacement target: {de!r}')
            if de in replacements:
                raise ValueError('German example appears in multiple input rows: ' + de)
            ar = outputs[row['n']]
            replacements[de] = ar
            changed += ar != original[de]['ar']
        if not changed:
            raise ValueError(f'Part {part}: output merely copies the old machine catalogue')
        artifacts.append({
            'input': input_path.name, 'output': output_path.name, 'rows': len(inputs),
            'inputSha256': hashlib.sha256(input_path.read_bytes()).hexdigest(),
            'outputSha256': hashlib.sha256(output_path.read_bytes()).hexdigest(),
        })
    if len(replacements) != 14069 or set(replacements) != targets:
        raise ValueError('The six parts do not exactly cover all 14,069 baseline machine entries')

    # Preserve all 334 prior assistant entries and 157 original Arabic entries.
    catalogue = {de: ({'ar': replacements[de], 'provider': 'assistant'}
                      if de in replacements else entry.copy())
                 for de, entry in original.items()}
    repairs, source_revision = applied_source_repairs()
    if repairs:
        catalogue = {de: entry for de, entry in catalogue.items() if de not in repairs}
        for repair in repairs.values():
            catalogue[repair['de']] = {'ar': repair['ar'], 'provider': 'assistant'}
    changed_unique = sum(replacements[de] != original[de]['ar'] for de in targets)
    occurrences = collections.Counter()
    changed_occurrences = 0
    level_coverage = {}
    all_sources = set()
    for level in LEVELS:
        data = read(ROOT / 'dist/data' / (level + '.json'))
        examples = [ex for word in data for ex in word.get('examples', [])]
        level_coverage[level] = {
            'examples': len(examples), 'covered': len(examples),
            'existingArabicPreserved': sum(catalogue[ex['de'].strip()]['provider'] == 'existing' for ex in examples),
        }
        for example in examples:
            de = example['de'].strip()
            all_sources.add(de)
            occurrences[catalogue[de]['provider']] += 1
            original_de = example.get('originalSource', {}).get('de', de).strip()
            changed_occurrences += original_de in replacements and replacements[original_de] != original[original_de]['ar']
    if all_sources != set(catalogue) or occurrences != {'assistant': 17427, 'existing': 157}:
        raise ValueError('Published examples differ from the expected source inventory')
    metadata = {
        'schemaVersion': 2, 'preparedAt': datetime.now(timezone.utc).isoformat(),
        'sourceLanguage': 'de', 'targetLanguage': 'ar',
        'method': 'contextual-authored-with-targeted-review',
        'precedence': ['existing', 'assistant'],
        'coverage': {'uniqueGermanSentences': len(catalogue), 'coveredUnique': len(catalogue),
                     'missingUnique': 0, 'exampleOccurrences': sum(occurrences.values()), 'levels': level_coverage},
        'uniqueCountsByProvider': dict(collections.Counter(entry['provider'] for entry in catalogue.values())),
        'occurrenceCountsByProvider': dict(occurrences),
        'providers': {
            'existing': {'kind': 'existing', 'description': 'Original Arabic preserved exactly.'},
            'assistant': {'kind': 'assistant-curated', 'humanReviewed': False,
                          'description': 'AI-assisted Arabic authored with German sentence and headword context; targeted assistant review. No claim of certified human translation.'},
        },
        'noteAr': ARABIC_NOTE,
        'preserveOriginalExampleProvenance': True,
        'sourceLicenseHandling': 'Existing German text, source, sourceUrl and licence fields are preserved. Translation provenance does not replace source licences.',
        'qualityStatus': 'Contextual AI-assisted authorship with targeted assistant review; not certified human translation.',
        'replacementCoverage': {'baselineCommit': BASELINE, 'newlyAuthoredUnique': len(replacements),
                                'scope': 'Initial translation pass, before the separately recorded source-example repairs.',
                                'changedArabicUnique': changed_unique,
                                'identicalArabicUnique': len(replacements) - changed_unique,
                                'changedArabicOccurrences': changed_occurrences,
                                'priorAssistantUniquePreserved': 334, 'originalArabicUniquePreserved': 157},
        'inputArtifacts': artifacts,
        'catalogue': 'tools/translations/example-ar.json',
        'importCommand': 'python tools/import-contextual-translations.py --input-dir /path/to/parts',
        'regenerationCommand': 'python tools/apply-example-translations.py',
        'validationCommand': 'python tools/apply-example-translations.py --check-only',
    }
    if source_revision:
        metadata['sourceExampleRevisions'] = source_revision
    summary = {'stage': 'contextual-import', 'replacedUnique': len(replacements),
               'changedArabicUnique': changed_unique, 'identicalArabicUnique': len(replacements) - changed_unique,
               'changedArabicOccurrences': changed_occurrences,
               'uniqueCountsByProvider': metadata['uniqueCountsByProvider'],
               'occurrenceCountsByProvider': dict(occurrences)}
    return catalogue, metadata, summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input-dir', type=Path, required=True)
    parser.add_argument('--check-only', action='store_true', help='Validate the complete import without writing files')
    args = parser.parse_args()
    try:
        catalogue, metadata, summary = prepare(args.input_dir)
        if not args.check_only:
            write(CATALOGUE, catalogue)
            write(METADATA, metadata)
        summary['written'] = not args.check_only
        print(json.dumps(summary, ensure_ascii=False))
    except (OSError, ValueError, KeyError, TypeError, subprocess.CalledProcessError) as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(2)


if __name__ == '__main__':
    main()
