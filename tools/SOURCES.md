# Vocabulary compilation

The published JSON files under `dist/data/` are the complete compiled learning data (2,000 records per level). Source datasets include imperfect and multi-language records; the app therefore uses curated seeds, authored Arabic glosses, explicit exclusions, and examples that contain the headword or a sourced inflection. Generic merged IPA/inflection tables are intentionally omitted; displayed morphology is in `reviewed-details.json` or the original curated vocabulary.

The equal-sized A1–C1 sections are approximate learning groups, not official CEFR exam lists. The inventory includes useful dictionary words and some lexicalized grammatical forms. Examples can be complete sentences or dictionary collocations. Arabic sentence translations are present when authored; the remaining examples are German.

Upstream inputs (download into ignored `data-sources/`):

- WortUniversum: https://huggingface.co/datasets/cstr/grundwortschatz-voc-de/resolve/main/grundwortschatz-app.db.gz. Dataset GPL-3.0; upstream Wiktionary CC BY-SA 4.0, Tatoeba CC BY 2.0 FR; source-marked generated learning examples.
- FreeDict German–English: https://download.freedict.org/dictionaries/deu-eng/1.9-fd1/freedict-deu-eng-1.9-fd1.src.tar.xz. Original Ding by Frank Richter/contributors GPL-2.0-or-later; conversion components include GPL-3.0 / AGPL-3.0. Preserve upstream TEI header and COPYING notices.
- FreeDict English–Arabic / Arabeyes: https://download.freedict.org/dictionaries/eng-ara/0.6.3/freedict-eng-ara-0.6.3.src.tar.xz. GPL-2.0-or-later. English pivots were used during research, then replaced by authored Arabic glosses before publication.
- Selected reviewed German–Arabic entries only: https://github.com/Mohamed-bouri/german-arabic (MIT). Unreviewed generated compounds/prefix descriptions were excluded.

Scripts under `sources/` record the extraction and initial lookup process. Their intermediate files remain ignored. `validate-examples.py` filters unrelated merged examples. `build-corpus.py` applies original IDs, authored translations, metadata corrections, exclusions, and level balancing. `check-data.mjs --target` checks the shipped 10,000 records, unique headwords, every Arabic meaning/example, old IDs and ten shields.

The site's Sources dialog exposes dataset attribution and direct JSON downloads; source-specific licence copies are under `dist/licenses/`.
