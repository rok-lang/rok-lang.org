# rok-lang.org

Source for the two Rok websites, built by one static site generator written in Rok:

- rok-lang.org: the landing page (`www/index.md`) and the installers (`/install.sh`, `/install.ps1`), built into `public/www/`.
- docs.rok-lang.org: the docs, one directory per version (`/0.1/`, `/dev/`, `/latest/`), built into `public/docs/<version>/`.

The docs combine the spec (English `spec/en`, Korean `spec/ko`), the standard library API extracted from `rok/library`, and this repo's `docs/` (home, guide, examples).

## Build

Needs the Rok toolchain (`rok`, `rokc`) plus checkouts of [rok-lang/rok](https://github.com/rok-lang/rok), [rok-lang/spec](https://github.com/rok-lang/spec), and the `markdown` / `rok-syntax` stones, laid out beside this repo (see `rok.rokon`):

```
./
|-- rok/                # toolchain; rok/library is the standard library
|-- spec/               # spec/en/ + spec/ko/
|-- stones/markdown/    # markdown renderer stone
|-- stones/rok-syntax/  # rok / ROKON highlighter stone
`-- rok-lang.org/       # this repository
```

If checkouts live elsewhere, point `spec`, `spec_ko`, and `library` at them in `site.local.rokon` (git-ignored; overrides `site.rokon`). No toolchain? Install one (`curl -fsSL https://rok-lang.org/install.sh | sh`) or `cargo build --release` in `../rok`.

```bash
rok run                      # build public/www/ and the dev docs
rok run -- --version 0.1     # build the 0.1 docs (and latest/ if it is newest)
rok run -- check             # build + run code blocks; exit 1 on broken links or failed blocks
rok run -- code [filter]     # run code blocks only
rok test                     # code block extraction tests
```

Generation takes 1-5 seconds; `check` compiles and runs hundreds of code blocks and takes 1-3 minutes. See `src/check.rok` for the ` ```rok ` block check rules (`build`, `norun`, `output`).

## Preview

Serve over HTTP (the search index is loaded with `fetch`); set `base_url` / `docs_url` in `site.local.rokon` for cross-site links.

```bash
python3 -m http.server -d public/www 8401    # rok-lang.org
python3 -m http.server -d public/docs 8403   # docs.rok-lang.org
```

## Release and deploy

Old versions are never rebuilt: each release's docs are built once from its tags and kept on the `docs-archive` branch.

```bash
# At a release, after tagging spec, impl and this repo:
ROK=<the release's rok> scripts/release-docs.sh 0.1 v0.1.0
git push origin docs-archive

# At every deploy, from main:
scripts/assemble.sh          # docs-archive -> public/docs/, then build dev + home site
# upload public/www/ as rok-lang.org and public/docs/ as docs.rok-lang.org
```

## Configuration

Edit `site.rokon` (ROKON); `site.local.rokon` overrides its fields. Key fields: `title`, `tagline`, `description`, `base_url`, `docs_url`, `spec` / `spec_ko`, `packages`, `library`, `out`. `versions.rokon` lists released docs versions, newest first.

## Layout

| File | Contents |
|------|----------|
| `src/main.rok`   | Config, spec/pages collection, generation, search index, link check |
| `src/check.rok`  | Code block extraction and parallel compile / run / output comparison |
| `src/apidoc.rok` | API pages from the standard library sources |
| `src/layout.rok` | Page frames: header, navigation, sidebar, footer, 404 |
| `www/index.md`   | Landing page |
| `docs/`          | Docs home, guide (`learn/`), examples (`examples/`) |
| `scripts/`       | `release-docs.sh`, `assemble.sh` |
| `static/`        | `style.css`, `search.js`, logos, `og.png` |

Markdown and ` ```rok ` / ` ```rokon ` highlighting come from the [`markdown`](https://github.com/rok-lang/markdown) and [`rok-syntax`](https://github.com/rok-lang/rok-syntax) stones (path dependencies until switched to their rokstones.io versions).
