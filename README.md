# rok-lang.org

The generator for the two Rok websites, written in Rok. The pages themselves live in their own repositories:

- rok-lang.org: the landing page (`src/home.rok`), the download and roadmap pages from [rok-lang/www](https://github.com/rok-lang/www) and the installers (`/install.sh`, `/install.ps1`), built into `public/www/`.
- docs.rok-lang.org: the docs, one directory per version (`/0.1/`, `/dev/`, `/latest/`), built into `public/docs/<version>/`.

The docs combine the guide, examples and error codes from [rok-lang/docs](https://github.com/rok-lang/docs), the spec (English `spec/en`, Korean `spec/ko`) and the standard library API extracted from `rok/library`. Released versions are the `vX.Y.Z` branches of docs and spec.

Every docs page is in English and Korean: `/<version>/<path>` and `/<version>/ko/<path>`, with a language switch on each page and hreflang links between the two. The Korean pages are `ko/` in rok-lang/docs and `spec/ko`; a page not translated yet serves its English text under a note, with `noindex`, and stays out of the sitemap. The API reference comes from the library's English doc comments: `/<version>/ko/std/` shows the same English text in Korean chrome, under a note, with `noindex` and its canonical address on the English page. Each language has its own search index (`search-index.json`, `ko/search-index.json`) and 404 page.

## Build

Needs the Rok toolchain (`rok`, `rokc`), the [web kit](https://github.com/rok-lang/web) submodule at `web/` (clone with `git clone --recurse-submodules`, or run `git submodule update --init` in an existing clone), plus checkouts of [rok-lang/docs](https://github.com/rok-lang/docs), [rok-lang/www](https://github.com/rok-lang/www), [rok-lang/rok](https://github.com/rok-lang/rok), [rok-lang/spec](https://github.com/rok-lang/spec), and the `markdown` / `rok-syntax` stones, laid out beside this repo (see `rok.rokon`):

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
rok run -- home              # rewrite home/<name>.out from `rok run` (check fails while they differ)
rok test                     # code block extraction tests
```

Generation takes 1-5 seconds; `check` compiles and runs hundreds of code blocks and takes 1-3 minutes. See `src/check.rok` for the ` ```rok ` block check rules (`build`, `norun`, `output`).

## Web kit

`web/` is [rok-lang/web](https://github.com/rok-lang/web), pinned to a commit. The generator builds its `web` library in (`Dep::path("web/rok")`): HTTP and the canonical-address rules (`web::url`), the theme controls, social links and footer (`web::chrome`), the library scanner behind the API pages (`web::apidoc`), and the kit's files, which every build writes beside `static/` into `public/www/` and each docs version directory: `rok.css`, `theme.js`, `keys.js`, `copy.js`, `rok.svg`, `logo.svg`, `favicon.ico`, `apple-touch-icon.png`, plus the webfonts, copied from `web/assets/fonts` to `fonts/` (Geist, Geist Mono, Pretendard; Korean pages load Pretendard's stylesheet). The fonts are files, not built in, so `serve` needs `web/assets/fonts` beside `site.rokon` and `static/` at run time. Move to a newer kit with:

```bash
git submodule update --remote web
rok run && rok test
git commit -am "chore: bump the web kit"
```

## Preview

Serve over HTTP (the search index is loaded with `fetch`); set `base_url` / `docs_url` in `site.local.rokon` for cross-site links. Pages link with canonical addresses (`/latest/learn/05-sum-types`: no `.html`, no `/index`, no trailing slash but on `/`), which `serve` resolves to `<path>.html` or `<path>/index.html`; a plain file server needs the `.html` typed in.

```bash
python3 -m http.server -d public/www 8401    # rok-lang.org
python3 -m http.server -d public/docs 8403   # docs.rok-lang.org
```

## Serve

`rok_lang_org serve` runs both sites from content bundles (one ROKON file per branch of docs, www and spec, built by `rok-content bundle` in [rok-lang/web](https://github.com/rok-lang/web)). A release is a `vX.Y.Z` branch in both docs and spec (nothing lists them by hand; the newest is `latest/` and the release the home and download pages offer). It archives each release once, from those branches and the release tag of rok, wraps every archive in the current chrome, and rebuilds when a bundle changes. `serve.rok` lists its environment.

Deployment itself lives in a private repository.

## Link previews

og:image and twitter:image are `og.png?v=<first 10 hex digits of its SHA-256>`, taken from `static/og.png` at build time, so a new image is a new URL that every platform fetches afresh. Stylesheets and scripts are linked the same way (`rok.css?v=...`). `serve` is the only place that sets caching: a file asked for at its current `?v=` keeps a year (`immutable`); pages of a released version (`/0.1.2/...`) and the fonts a day; pages of `latest/`, `dev/` and rok-lang.org, and the search indexes, five minutes; other files an hour. Every page carries an ETag and answers `If-None-Match` with 304. The docs have a card per section and per guide chapter in each language (`static/og/<page>.png`, each with its own `?v=`), with the section, the title and the page's first sentence; other pages use their section's card. A build writes the cards it wants to `public/og-cards.json` and says when `static/og/` no longer matches; render them with `og/cards.mjs`. When only a page's text changes, the cached card stays: re-scrape it with the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/), the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) or Kakao's [sharing debugger](https://developers.kakao.com/tool/debugger/sharing) (clear the cache); X has no tool and refreshes in about 7 days.

## Configuration

Edit `site.rokon` (ROKON); `site.local.rokon` overrides its fields. Key fields: `title`, `tagline`, `description`, `base_url`, `docs_url`, `docs`, `www`, `spec` / `spec_ko`, `packages`, `library`, `out`. `versions.rokon` lists released docs versions, newest first, for local builds; the server works them out from the branches.

## Layout

| File | Contents |
|------|----------|
| `src/main.rok`   | Config, spec/pages collection, generation, search index, link check |
| `src/check.rok`  | Code block extraction and parallel compile / run / output comparison |
| `src/apidoc.rok` | API pages from the standard library sources |
| `src/layout.rok` | Page frames: header, navigation, sidebar, footer, 404 |
| `src/home.rok`   | The rok-lang.org landing page; its release notes come from rok's CHANGELOG.md, archive sizes from the GitHub release |
| `home/`          | The landing page's programs and what `rok run` prints for each (`<name>.out`, checked by `rok run -- check`) |
| `src/serve.rok`  | The server: bundles, release archives, rebuilds, routing |
| `static/`        | `style.css` (this site), `search.js`, `og.png`, `og/` (the docs' cards) |
| `web/`           | the web kit (submodule): `rok.css`, `theme.js`, `keys.js`, marks and icons, and the `web` library (HTTP, addresses, footer markup) |
| `og/`            | `og.png` source: `cd og && npm ci && node render.mjs card.html ../static/og.png`; the docs' cards: `node cards.mjs ../public/og-cards.json ../static/og` |

Markdown and ` ```rok ` / ` ```rokon ` highlighting come from the [`markdown`](https://github.com/rok-lang/markdown) and [`rok-syntax`](https://github.com/rok-lang/rok-syntax) stones (path dependencies until switched to their rokstones.io versions).
