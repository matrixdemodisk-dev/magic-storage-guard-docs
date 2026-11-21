# Magic Storage Guard documentation site

The public description and privacy policy for Magic Storage Guard, a personal utility.

Published with GitHub Pages from the root of the `main` branch:
<https://matrixdemodisk-dev.github.io/magic-storage-guard-docs/>

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The whole site: description, privacy policy (`#privacy`), personal use statement (`#use`). |
| `404.html` | Page GitHub Pages serves for unknown addresses. |
| `.nojekyll` | Publishes files as they are, with no Jekyll processing. |
| `tools/check-site.mjs` | Invariant checks. No dependencies. |
| `.htmlvalidate.json` | HTML validator configuration. |
| `.github/workflows/site-checks.yml` | Runs both checks on every pull request and on `main`. |

## Rules for changes

1. Anything merged to `main` is live within about a minute. Change the site through a pull request and merge only when the checks pass.
2. Keep the `#privacy` and `#use` anchors. Links from outside this site point at them.
3. When the wording of the privacy policy changes, update the effective date in both places on the same line: the `datetime` attribute and the visible text. The checks fail if they disagree.
4. No scripts, analytics, fonts, images or stylesheets from other hosts. The checks enforce this.
5. Never commit credentials, private files or account details. This repository is public.

## Run the checks locally

Requires Node.js 22 or later.

```sh
npx --yes html-validate@11.21.1 index.html 404.html
node tools/check-site.mjs
```

## Rollback

Revert the merge commit on `main`. GitHub Pages republishes the previous version automatically.
