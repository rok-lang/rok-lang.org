# rok-lang.org

The generator for the two Rok websites, written in Rok. The pages themselves live in their own repositories:

- rok-lang.org: the landing page (`src/home.rok`), the download and roadmap pages from [rok-lang/www](https://github.com/rok-lang/www) and the installers (`/install.sh`, `/install.ps1`), built into `public/www/`.
- docs.rok-lang.org: the docs, one directory per version (`/0.1/`, `/dev/`, `/latest/`), built into `public/docs/<version>/`.

The docs combine the guide and examples from [rok-lang/docs](https://github.com/rok-lang/docs), the spec (English `spec/en`, Korean `spec/ko`) and the standard library API extracted from `rok/library`. Released versions are the `vX.Y.Z` branches of docs and spec.

## Build

Needs the Rok toolchain (`rok`, `rokc`) plus checkouts of [rok-lang/docs](https://github.com/rok-lang/docs), [rok-lang/www](https://github.com/rok-lang/www), [rok-lang/rok](https://github.com/rok-lang/rok), [rok-lang/spec](https://github.com/rok-lang/spec), and the `markdown` / `rok-syntax` stones, laid out beside this repo (see `rok.rokon`):

```
./
|-- docs/               # guide, examples
|-- www/                # home, download, roadmap
|-- rok/                # toolchain; rok/library is the standard library
|-- spec/               # spec/en/ + spec/ko/
|-- stones/markdown/    # markdown renderer stone
|-- stones/rok-syntax/  # rok / ROKON highlighter stone
`-- rok-lang.org/       # this repository
```

If checkouts live elsewhere, point `docs`, `www`, `spec`, `spec_ko`, and `library` at them in `site.local.rokon` (git-ignored; overrides `site.rokon`). No toolchain? Install one (`curl -fsSL https://rok-lang.org/install.sh | sh`) or `cargo build --release` in `../rok`.

```bash
rok run                      # build public/www/ and the dev docs
rok run -- --version 0.1     # build the 0.1 docs (and latest/ if it is newest)
rok run -- check             # build + run code blocks; exit 1 on broken links or failed blocks
rok run -- code [filter]     # run code blocks only
rok test                     # code block extraction tests
```

Generation takes 1-5 seconds; `check` compiles and runs hundreds of code blocks and takes 1-3 minutes. See `src/check.rok` for the ` ```rok ` block check rules (`build`, `norun`, `output`).

## Preview

Serve over HTTP (the search index is loaded with `fetch`); set `base_url` / `docs_url` in `site.local.rokon` for cross-site links. Pages link with canonical addresses (`/latest/learn/05-sum-types`: no `.html`, no `/index`, no trailing slash but on `/`), which `serve` resolves to `<path>.html` or `<path>/index.html`; a plain file server needs the `.html` typed in.

```bash
python3 -m http.server -d public/www 8401    # rok-lang.org
python3 -m http.server -d public/docs 8403   # docs.rok-lang.org
```

## Serve

`rok_lang_org serve` runs both sites from content bundles (one ROKON file per branch of docs, www and spec, built by `rok-content bundle` in [rok-lang/web](https://github.com/rok-lang/web)). It archives each release in `versions.rokon` once, from the `vX.Y.Z` branches of docs and spec and the release tag of rok, wraps every archive in the current chrome, and rebuilds when a bundle changes. `serve.rok` lists its environment.

Deployment itself lives in a private repository.

## Link previews

og:image and twitter:image are `og.png?v=<first 10 hex digits of its SHA-256>`, taken from `static/og.png` at build time, so a new image is a new URL that every platform fetches afresh. `serve` caches `og.png` at its current `?v=` for a year (`immutable`), anything else for an hour. When only a page's text changes, the cached card stays: re-scrape it with the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/), the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) or Kakao's [sharing debugger](https://developers.kakao.com/tool/debugger/sharing) (clear the cache); X has no tool and refreshes in about 7 days.

## Configuration

Edit `site.rokon` (ROKON); `site.local.rokon` overrides its fields. Key fields: `title`, `tagline`, `description`, `base_url`, `docs_url`, `docs`, `www`, `spec` / `spec_ko`, `packages`, `library`, `out`. `versions.rokon` lists released docs versions, newest first.

## Layout

| File | Contents |
|------|----------|
| `src/main.rok`   | Config, spec/pages collection, generation, search index, link check |
| `src/check.rok`  | Code block extraction and parallel compile / run / output comparison |
| `src/apidoc.rok` | API pages from the standard library sources |
| `src/layout.rok` | Page frames: header, navigation, sidebar, footer, 404 |
| `src/home.rok`   | The rok-lang.org landing page; its release notes come from rok's CHANGELOG.md |
| `src/serve.rok`  | The server: bundles, release archives, rebuilds, routing |
| `static/`        | `rok.css` (shared tokens, a copy of `css/rok.css` from [rok-lang/web](https://github.com/rok-lang/web); do not edit here), `style.css` (this site), `search.js`, logos, `og.png` |
| `og/`            | `og.png` source: `cd og && npm ci && node render.mjs card.html ../static/og.png` |

Markdown and ` ```rok ` / ` ```rokon ` highlighting come from the [`markdown`](https://github.com/rok-lang/markdown) and [`rok-syntax`](https://github.com/rok-lang/rok-syntax) stones (path dependencies until switched to their rokstones.io versions).
