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

## GitHub Pages (Codex-free deployment)

This repository contains an automated GitHub Pages workflow at
[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).
It serves the contents of `dist/` without a build step.

One-time setup by a repository administrator:

1. Open [GitHub Pages settings](https://github.com/khaled368/kalima-learning/settings/pages).
   Under **Build and deployment → Source**, select **GitHub Actions**.
   The workflow is already in the repository; do not generate a replacement workflow.
2. Open [Actions](https://github.com/khaled368/kalima-learning/actions/workflows/deploy-pages.yml).
   If the initial run failed before Pages was enabled, select **Run workflow**
   on `main`. Check that the deployment job succeeds.
3. The new site address will be
   **https://khaled368.github.io/kalima-learning/** after the first successful deploy.
4. Open [Supabase Authentication → URL Configuration](https://supabase.com/dashboard/project/uewvccgriojmpngxufev/auth/url-configuration)
   and **add** `https://khaled368.github.io/kalima-learning/` as an
   allowed **Redirect URL**. Keep the existing Site URL and redirect entry
   for the original deployment until the migration is completed.

Any later push to `dist/` on `main` triggers automatic publishing through
GitHub Actions. The site's scripts/styles/data use relative paths, so they can
be hosted beneath `/kalima-learning/`. Account sign-up and password recovery
use the currently visited page as their callback URL, so both origins need
to be in the Supabase redirect allowlist. New origins have separate local
browser storage; sign in with the **same Supabase account** on the new site to
recover cloud-synced progress. Do not delete the old site during migration.

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
