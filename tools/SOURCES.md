# Vocabulary compilation

The published JSON files under `dist/data/` are the complete compiled learning data (2,000 records per level). Source datasets include imperfect and multi-language records; the app therefore uses curated seeds, authored Arabic glosses, explicit exclusions, and examples that contain the headword or a sourced inflection. Generic merged IPA/inflection tables are intentionally omitted; displayed morphology is in `reviewed-details.json` or the original curated vocabulary.

The equal-sized A1–C1 sections are approximate learning groups, not official CEFR exam lists. The inventory includes useful dictionary words and some lexicalized grammatical forms. Examples can be complete sentences or dictionary collocations. All 17,584 example occurrences include Arabic. Original Arabic is preserved; the additional translations are prepared Google machine translations or targeted assistant corrections. Machine translations are labelled in the interface and have not all received semantic review.

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
