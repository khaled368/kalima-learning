# Vocabulary compilation

The original German JSON files under `dist/data/` retain 2,000 records per level. Additional curricula live under `dist/data/courses/`; each manifest reports its actual compiled counts. Source datasets include imperfect and multi-language records; the app therefore uses curated seeds, authored Arabic glosses, explicit exclusions, and examples that contain the headword or a sourced inflection. Generic merged IPA/inflection tables are intentionally omitted; displayed morphology is in `reviewed-details.json` or the original curated vocabulary.

The equal-sized A1–C1 sections are approximate learning groups, not official CEFR exam lists. The inventory includes useful dictionary words and some lexicalized grammatical forms. Examples can be complete sentences or dictionary collocations. All 17,584 original German example occurrences include Arabic. Original Arabic and source provenance are preserved. The current contextual Arabic catalogue uses assistant-assisted authorship and targeted checks, as documented below; it does not use Google translation or claim certified human review.

Upstream inputs (download into ignored `data-sources/`):

- WortUniversum: https://huggingface.co/datasets/cstr/grundwortschatz-voc-de/resolve/main/grundwortschatz-app.db.gz. Dataset GPL-3.0; upstream Wiktionary CC BY-SA 4.0, Tatoeba CC BY 2.0 FR; source-marked generated learning examples.
- FreeDict German–English: https://download.freedict.org/dictionaries/deu-eng/1.9-fd1/freedict-deu-eng-1.9-fd1.src.tar.xz. Original Ding by Frank Richter/contributors GPL-2.0-or-later; conversion components include GPL-3.0 / AGPL-3.0. Preserve upstream TEI header and COPYING notices.
- FreeDict English–Arabic / Arabeyes: https://download.freedict.org/dictionaries/eng-ara/0.6.3/freedict-eng-ara-0.6.3.src.tar.xz. GPL-2.0-or-later. English pivots were used during research, then replaced by authored Arabic glosses before publication.
- Selected reviewed German–Arabic entries only: https://github.com/Mohamed-bouri/german-arabic (MIT). Unreviewed generated compounds/prefix descriptions were excluded.

Scripts under `sources/` record the extraction and initial lookup process. Their intermediate files remain ignored. `validate-examples.py` filters unrelated merged examples. `build-corpus.py` applies original IDs, authored translations, metadata corrections, exclusions, and level balancing. `check-data.mjs --target` checks the shipped 10,000 records, unique headwords, every Arabic meaning/example, old IDs and ten shields.

The site's Sources dialog exposes dataset attribution and direct JSON downloads; source-specific licence copies are under `dist/licenses/`.


## Verb coverage and interactive lessons (November update)

The browser loads `dist/data/verbs.json` lazily through `dist/verbs.js`. All 1,844 verb cards are mapped to 1,525 paradigms. Each paradigm has six-person present, preterite and perfect tables; nonapplicable persons of impersonal verbs are explicitly marked. Stable card IDs are retained when repairing noun/verb homonyms or displayed capitalization.

Sources: `german-verbs-dict`3.4.0 and `german-verbs`5.4.0 (RosaeNLG/LanguageTool; Morphy by WolfgangLezius, extended by korrekturen.de). Linguistic data CC BY-SA4.0; helpercode Apache2.0. Package tarballs:

- https://registry.npmjs.org/german-verbs-dict/-/german-verbs-dict-3.4.0.tgz
- https://registry.npmjs.org/german-verbs/-/german-verbs-5.4.0.tgz

`tools/build-verb-principals.py` and `tools/build-verbs.cjs` record compilation from the local raw dictionary folders. After regenerating the core corpus, run `python tools/apply-verb-repairs.py` to preserve the reviewed card metadata. `node tools/check-verbs.cjs` verifies every verb card plus irregulars, separable/reflexive forms and modern orthography. Licence copies are shipped in `dist/licenses/`.

`dist/writing.js` and `dist/sentences.js` contain original educational content:10writing prompts and25sentence-ordering exercises acrossA1–C1. Writing guidance uses self-review and local drafts; it does not claim automated free-text grammar grading.


## Arabic examples and progress update

`tools/translations/example-ar.json` records 14,560 unique German examples with Arabic and translation provenance. Run `python tools/apply-example-translations.py` after rebuilding the corpus; `--check-only --baseline 141f3898e87be684f7bc7a49590f7d45d01909bf` verifies coverage, exact original Arabic and unchanged German/source fields against the preceding publication. Google Translate was used only during preparation; the published site never calls a translation service. The earlier local OPUS experiment is excluded. Published counts and preparation details are in `dist/data/example-translations.json`. Original example source/author/licence fields remain intact.

`dist/audio.js` and the bundled official meSpeak2.0.7/eSpeak German voice render PCM locally. First use downloads the engine; later playback does not depend on installed German device voices. GPL3 notices and source archive links are shipped under `dist/assets/audio-engine/`. Playback unlocks from a user gesture and reports loading/playing/error states.

`dist/history.js` records first-learning local dates while retaining stable IDs. Old known words without recoverable dates remain undated; repeat review does not add new learning events. `dist/analytics.js` presents 7/30/90-day daily/cumulative charts and level filters, explicitly distinguishing unrecorded history from zero. `dist/usage.js` counts focused, visible time with a five-minute idle allowance, local-day splits, and multi-tab deduplication; previous unrecorded time cannot be reconstructed. All learner data stays in localStorage. `check-history.cjs` and `check-usage.cjs` exercise migration, deduplication, hidden/blur/idle, clocks and DST.

`dist/assessment.js` samples 25 vocabulary recognition questions across A1–C1, preferring learned words without treating saved words as mastered. Its result is an approximate vocabulary indicator, not a full CEFR proficiency assessment. It does not change learned or saved state. Learned-only review appears once a selected level has at least one learned word. Earned shields have a separate page and the highest earned shield appears in the header.


## Journey interface

The journey redesign adds a navy/turquoise interface across vocabulary, lessons, training, saved words, shields, Sources, analytics and assessment. `journey-theme.css` contains global styling; the component styles remain scoped in `journey-calendar.css` and `journey-lessons.css`.

The vocabulary homepage lists each existing 2,000-word level directly. It has no numbered path or 50-word grouping. Search, part-of-speech filters, pagination and the daily-goal shortcut operate across the full selected level. Navigation does not change learning or saved records.

`journey-calendar.js` shows the last28localdays using deduplicated first-learning events. It distinguishes unrecorded days and partial recovered history; undated legacy words are not assigned to invented dates. This calendar measures new-word learning, while the separate usage panel measures foreground time.


## Contextual Arabic example translations (current, November 2026)

This section supersedes the earlier machine-translation preparation notes above. All 14,069 formerly machine-backed unique German examples were freshly translated by the assistant from the German sentence and its associated headword context, without displaying the previous machine translation during authorship or using an external translation service. The catalogue retains the 334 earlier assistant entries and 157 original Arabic entries exactly. The published corpus now has 17,427 assistant-translated occurrences and 157 original Arabic occurrences (17,584 total; 14,560 unique German examples).

ترجمات عربية صيغت بمساعدة الذكاء الاصطناعي مع مراعاة سياق الأمثلة؛ ليست ترجمة بشرية معتمدة

The preparation method is `contextual-authored-with-targeted-review`. It records AI-assisted authorship and targeted assistant checks, not certified human translation or independent specialist review of every sentence. Ambiguous or imperfect upstream German is preserved in this translation pass. Translation provenance does not replace the original example source, source URL or licence.

`python tools/import-contextual-translations.py --input-dir /path/to/parts` requires all six complete source/context JSONL and authored Arabic TSV pairs. It verifies exact coverage against the former machine-backed catalogue at commit `42508d99d5fb6d16f9eb4941d2a2b1095907d397`, rejects incomplete, duplicate, non-Arabic, mismatched-source and copied-catalogue inputs, and records input/output SHA-256 hashes in `dist/data/example-translations.json`. The previous `--prepare-catalog` pipeline has been removed. Missing authored files cannot fall back to relabelling previous machine translations.

Run `python tools/apply-example-translations.py` after regeneration, then `python tools/apply-example-translations.py --check-only` and `node tools/check-data.mjs --target`. Validation requires zero machine/Google example provenance, exact preservation of all 10,000 card IDs, order, glosses and other card fields, exact German/source fields, and exact original Arabic against the pinned publication. The current provider counts and preparation details are published in `dist/data/example-translations.json` and the Sources dialog.

### Approved source-example repairs

After the translation-only pass, the explicit whitelist in `tools/translations/source-example-repairs.json` replaced 60 defective upstream German sentences in 64 occurrences with newly authored German/Arabic learning examples. These examples are attributed to `Wort — مثال تعليمي مُعدّ للموقع`, marked as assistant-authored source repairs, and carry an honest original-learning-example licence note. Their exact previous German, source, URL, licence and other upstream fields remain nested under `originalSource`; the new sentences are not attributed to Tatoeba or another upstream author.

Source repairs are activated explicitly with `python tools/apply-example-translations.py --apply-source-repairs tools/translations/source-example-repairs.json`. The active map's SHA-256 and repaired unique/occurrence counts are recorded in `dist/data/example-translations.json`. Later application and import retain that approved map, and validation accepts only those exact German/source changes. Card IDs, headwords, glosses, morphology and the 157 original Arabic occurrences remain unchanged. These are AI-assisted educational examples and do not claim certified human translation or review.


The direct vocabulary homepage uses `home.css`; every level retains all 2,000 cards in its original order. Turquoise control colors preserve the established theme; only previous/next word controls use the black/white palette in `word-navigation.css`. Semantic article and grammar colors remain unchanged. Search, filters, review and Sources are grouped in the library control disclosure. Word details share a persistent summary above tabs and keep conjugation and Arabic/German text available. Progress shows the chart first, real hours and distinct active days, assessment and calendar; usage durations are displayed only as fractional hours, without minutes/seconds clocks. Existing duration storage remains milliseconds for accuracy.


`bottom-nav.css` refines the existing six-destination navigation into a turquoise floating dock with consistent icon sizing, active state, focus feedback, and safe-area spacing. The training destination is now learned-word review: its multiple-choice targets come exclusively from learned cards in the selected level; other level words may supply distractor translations. Reviewing does not award new learned words or alter learning history. `review-screen.css` places large German text and a compact pronunciation icon in one row. The vocabulary assessment in Progress remains independent.


The word-detail learned action records a card once, shows a green confirmation for 650ms, then opens the next unlearned card in the same level. Closing the dialog or navigating to another card cancels pending advancement. The separate word-detail Next button is removed; Previous remains available. Completing the final unlearned card closes the dialog with a level-complete message.


## Four-language courses

`course.js` initializes the native and target language before progress modules load. Arabic, English, Dutch and German form twelve valid distinct pairs. The course picker persists `wort-course-selection` and reloads once; the native language controls menus, explanations, locale and reading direction. Target words, translations, examples and audio have independent language attributes. `content.js` adapts the multilingual records to the existing card interface without changing legacy German IDs.

Learning, saved words, first-learning history, sentence progress and writing drafts follow the target language. German retains its original storage keys; other targets append their code. Changing only the native language preserves target knowledge. Recognition assessment results are pair-scoped, retaining the original Arabic-to-German result key. Site usage time remains global.

New vocabulary is compiled by `tools/build-multilingual.py` from the versioned WikDict SQLite sources, Ding/FreeDict, Arabic/Open Dutch/Princeton WordNet, manually authored contextual English/Dutch meanings, and the four-language foundation. Exact concept links, part-of-speech and original Arabic meaning agreements constrain dictionary admission. Counts are actual unique target terms; data is not padded to claim 2,000 words per new level. FrequencyWords orders approximate study bands, not official CEFR exam lists. Source-specific licences and WordNet permission notices ship in `dist/licenses/`.

`tools/multilingual/legacy-overrides-*.json` records contextual English and Dutch glosses prepared against each original German/Arabic card. These are assistant-assisted educational translations, not certified human translations. `data/courses/de/translations.json` supplements the unchanged German corpus. The new course manifests and `data/courses/sources.json` expose provenance and actual inventory sizes. The publication contains 10,000 German cards (2,000 per level), 8,400 English cards (1,680 per level), 8,755 Dutch cards (1,751 per level), and 8,535 Arabic cards (1,707 per level). All 10,000 German cards have contextual English and Dutch meanings in the supplement.

Tatoeba/ManyThings examples are joined from attributed source pairs. Each emitted example contains only target/native languages whose context was validated for that card; authored foundation examples are labelled separately. The card adapter displays an example only when both selected languages are available. Existing German/Arabic examples remain unchanged. Coverage differs by pair and is reported honestly in course metadata.

Original German grammar remains mapped through `verbs.json`. `grammar.js` adds exact teaching tables for common English, Dutch and Arabic verbs, including Arabic's actual person system. It displays a localized missing-table message for unverified paradigms. English/Dutch/Arabic sentence and writing workshops contain target-specific models and localized explanations; existing German exercises, prompts and draft IDs remain intact.

German, English and Dutch pronunciation use compatible bundled meSpeak voice data; real non-silent WAV synthesis is checked for all three. Arabic uses an available Arabic device voice and reports a localized unavailable error if none exists, without falling back to a different language. Source URLs and licence notices are in `assets/audio-engine/README-LICENSE.txt`.

Run `python tools/check-multilingual.py --require-authored` to check complete native-language supplements, actual counts, stable IDs, pairwise examples and byte-identical preservation of the original German files against the last single-course publication.
