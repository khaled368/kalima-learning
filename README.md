# كلمة · Kalima

A mobile vocabulary-learning app for Arabic, English, Dutch and German. The learner chooses a native language and a target language; menus and explanations follow the native language. Twelve distinct language pairs are available.

Live site: https://wort-arabic-lernen-1031.hsiihsii142.chatgpt.site/

## Current curriculum

| Target language | Total cards | Cards per A1–C1 section |
| --- | ---: | ---: |
| German | 10,000 | 2,000 |
| English | 8,400 | 1,680 |
| Dutch | 8,755 | 1,751 |
| Arabic | 8,535 | 1,707 |

Sections are approximate study bands, not certified CEFR exam inventories. Bilingual example coverage varies by selected language pair. The original German data and card IDs remain unchanged. Source licences, authorship and provenance are documented in [tools/SOURCES.md](tools/SOURCES.md).

## Run locally

The published app is buildless. Serve the static files over HTTP:

```sh
python -m http.server 8000 --directory dist
```

Open http://localhost:8000/. The official Supabase browser bundle is checked in and pinned to version 2.118.0; its source lockfile and integrity notes are in `tools/browser-vendor/`.

## Accounts and progress

Supabase Auth handles email/password accounts. `db/schema.sql` defines the owned progress snapshot and revision-checked save function. `db/verify-rls.sql` tests account isolation and write conflicts inside a rollback-only transaction. Project identifiers are in `db/project.json`.

`dist/backend-config.js` contains only a public project URL and publishable key. Never add service-role keys, database passwords, account passwords, browser auth sessions, or personal learning snapshots to this repository.

In Supabase Authentication → URL Configuration, the production Site URL and allowed Redirect URL must match the live origin above. Account confirmation and password recovery use those settings. Real email delivery remains subject to the project's configured mail provider.

Learning remains available locally. Signing in links progress to the account; local account workspaces and remote snapshots are kept separate. The learning app initializes after account workspace restoration. Website time is tracked as hours and active days; target-language knowledge is stored separately for each course.

## Data checks

```sh
python tools/check-multilingual.py --require-authored
node tools/check-history.cjs
node tools/check-usage.cjs
```

Raw upstream dictionary downloads are excluded from Git. Rebuilding course data requires those documented sources. User progress belongs in Supabase and browser storage, rather than GitHub commits.
