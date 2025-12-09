<!-- .github/copilot-instructions.md - Guidance for AI coding agents in this repo -->
# Copilot instructions for shahoran.github.io

This repository is a small static site (HTML/CSS/JS) serving a game compendium under `chaos/` that is data-driven via JSON files. The site is served directly as static files and uses jQuery + Bootstrap (CDNs). Use these notes to be immediately productive and avoid making breaking structural changes.

- Big picture:
  - The site is static HTML with client-side rendering. Data lives under `chaos/data/` (e.g. `characters.json`, per-character files under `chaos/data/characters/`, `fragments.json`, `neutrals.json`).
  - JavaScript renders pages by fetching JSON with `$.getJSON()` and inserting HTML (examples in `chaos/characters.js` and `chaos/character.js`).
  - Images are organized under `chaos/img/*` (cards, fragments, pjsbanner, epiphanies, icons, etc.).
  - i18n: translations live in `lang/en.json` and `lang/es.json` and are loaded by `js/general.js` using `data-i18n` attributes.
  - Local development: run the included lightweight server with `python server.py` from repo root (serves on http://localhost:8000). Alternative: `python -m http.server 8000`.

- Important file examples and patterns (copy/paste friendly):
  - Fetch a per-character JSON (character page):
    - `$.getJSON(getDailyURL('/chaos/data/characters/1.json'))`
  - Fallback pattern: `chaos/character.js` tries `/chaos/data/characters/{id}.json` and falls back to `/chaos/data/characters.json`.
  - Cache-busting: many scripts use `getDailyURL(path)` which appends `?v=YYYY-MM-DD`. Prefer using that helper when introducing asset/JSON requests.

- Conventions and constraints (do not change without asking):
  - Keep the static layout (header/footer includes) — pages load `header.html`/`footer.html` via `#header` / `#footer` and `js/general.js`'s `getBasePath()` logic. Use absolute `/` paths or `getBasePath()` for relative resolution.
  - Keep JSON schema stable: JS code expects specific keys (e.g., `cards`, `epiphanies`, `fragments`, `potentials`, `rarity`, `img`, `id`, `name`). If you must change schema, update all renderers accordingly.
  - i18n keys live in `lang/*.json`. When adding new UI text, add keys to both `en.json` and `es.json` and wrap elements with `data-i18n`.
  - Front-end uses jQuery + Bootstrap (CDNs). Avoid introducing framework rewrites (React/Vue) unless the user requests a migration.

- Common tasks & how to do them here:
  - Run locally: from repo root run `python server.py` and open `http://localhost:8000`.
  - Add a new character:
    1. Add JSON under `chaos/data/characters/{id}.json` matching existing structure (see `chaos/data/characters/1.json` for format).
    2. Add images under `chaos/img/pjsbanner/` and `chaos/img/icons/` as referenced by `img` and `class`/`element` keys.
    3. No build step required — refresh page (cache-busted by date if using `getDailyURL`).
  - Update translations: edit `lang/en.json` and `lang/es.json` and rely on `js/general.js` to reload languages.

- Potential pitfalls discovered in repo (things to be careful about):
  - Some JSON files may contain duplicate keys or inconsistent ids (example: `chaos/data/fragments.json` has repeated `f2` keys). Do not auto-fix data unless instructed — open an issue or ask the maintainer first.
  - Renderers assume images exist at specific paths (e.g., `/chaos/img/cards/{img}`). Adding references without assets will create broken images.
  - Tooltips and Bootstrap components are initialized manually in scripts; if you refactor markup, ensure re-initialization where needed.

- How to change code safely (recommendations for an AI agent):
  - Small, localized edits only. Prefer to modify or add helper functions (e.g., `getDailyURL`) instead of sweeping changes.
  - When editing JS renderers, preserve existing DOM ids/classes used across files (e.g., `#pj-tabs`, `#cartas-list`, `#epifanias-list`).
  - Add tests only if the user requests; this project currently has no automated test harness.

If anything above is unclear or you want me to include examples for other pages, tell me which file or feature to expand and I'll iterate.
