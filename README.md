# rok-lang.org

The two websites of the rok language, built by one static site generator written in rok:

- **rok-lang.org**: the landing page (`www/index.md`) and the installers (`/install.sh`, `/install.ps1`). Built into `public/www/`.
- **docs.rok-lang.org**: the documentation, one directory per version (`/0.1/`, `/dev/`, ...; `/latest/` is the newest release). Built into `public/docs/<version>/`.

For the docs, the generator reads both editions of the spec repository, English (`spec/en`, rendered at `spec/`) and Korean (`spec/ko`, rendered at `ko/spec/`), to build the language reference and the standard library reference. It extracts the API listing (`std/`) from the standard library sources of the implementation repository (`rok/library`), and adds the docs home, the guide (`learn/`) and the examples (`examples/`) from this repository's `docs/`.

## Build

You need the rok toolchain (`rok`, `rokc`), the spec, and the standard library sources. Clone [rok-lang/rok](https://github.com/rok-lang/rok) and [rok-lang/spec](https://github.com/rok-lang/spec) next to this repository; the stones [markdown](https://github.com/rok-lang/markdown) and [rok-syntax](https://github.com/rok-lang/rok-syntax) are path dependencies under `../stones/` (see `rok.rokon`).

```
./
├── rok/                   # toolchain; rok/library is the standard library
├── spec/                  # spec/en/ + spec/ko/
├── stones/markdown/   # markdown renderer stone
├── stones/rok-syntax/     # rok / ROKON highlighter stone
└── rok-lang.org/          # this repository
```

If your checkouts live elsewhere, put the paths in `site.local.rokon` (git-ignored). Its fields are laid over `site.rokon`:

```rokon
{
    spec: "/path/to/spec/en",
    spec_ko: "/path/to/spec/ko",
    library: "/path/to/rok/library",
}
```

If you have no toolchain, install one (`curl -fsSL https://rok-lang.org/install.sh | sh`, see [Getting Started](https://docs.rok-lang.org/latest/learn/01-getting-started.html)) or build it from source:

```bash
cd ../rok
cargo build --release
export PATH="$PWD/target/release:$PATH"
```

Then, in this repository:

```bash
rok run                      # build public/www/ and the dev docs in public/docs/dev/
rok run -- --version 0.1     # build the 0.1 docs in public/docs/0.1/ (and latest/ if 0.1 is the newest release)
rok run -- check             # build + run code blocks; exit code 1 on broken links or failed blocks
rok run -- code [filter]     # run code blocks only (pages whose path contains filter); leaves public/ alone
rok test                     # code block extraction tests
```

The search index (`search-index.json`) writes each page once, `{"p": [[title, url], ...], "h": [[page, heading, id], ...]}`, and `search.js` reads it into one list of hits.

When the build finishes it prints the page count, the broken link count, and the elapsed time. The link check re-reads the generated HTML every time and verifies that the target file and `#anchor` of every `href` / `src` exist. Generation alone takes 1-5 seconds; `check` compiles and runs hundreds of code blocks in parallel and takes about 1-3 minutes depending on the machine.

### Code block checks

Every ` ```rok ` block in the markdown under `docs/` and in `www/index.md` is compiled and run as a standalone program (`rokc run <block>.rok`, in `rok-lang.org-snippets/` under the system temp directory). The second word of the info string changes the behavior.

| Block | Check |
|-------|-------|
| ` ```rok `        | Compile and run; must exit with code 0 |
| ` ```rok build `  | Compile only (servers, programs that read stdin, and so on) |
| ` ```rok norun `  | Not checked (fragments, examples blocked by toolchain bugs) |

A ` ```output ` block right after a run block is the expected stdout. It must match exactly, ignoring trailing whitespace. On the page it shows as an "Output" box below the code. Stdin is empty, there are no arguments, and each block has a 60-second limit. The toolchain is taken from the `ROKC` environment variable, or `rokc` on `PATH`.

### Standard library API

Starting from `src/lib.rok` of `bare` / `core` / `std` under `library` in `site.rokon` (default `../rok/library`), the generator follows `pub mod` and builds one page per module (`std/<tier>/<module path>.html`). It shows the signatures of `pub` items as written, uses the `///` comment right above as documentation, and uses the file's first comment block as the module description. Members of structs / enums / traits / inherent `impl`s and the list of trait implementations are included. Items and methods go into the search index. A module with more than 300 members on one page (`rok::core::num::ints`) moves each item of 20 or more members to a page of its own, `std/<tier>/<module path>/<kind>.<name>.html` (`ints/impl.i32.html`), and its page lists them.

Why not `rokc doc`: `rokc doc` documents only the user package and `--extern` dependencies and skips the `rok::` standard library, and the standard library does not compile as a user package (lang slots, type keywords, `rok::core` paths). So `src/apidoc.rok` scans the sources directly (it masks comments / strings, then finds item boundaries by bracket depth).

## Versions

`versions.rokon` lists the released docs versions, newest first. A version is `<major>.<minor>`: the docs of 0.1.0, 0.1.1, ... are all `0.1/`.

Each build writes one version directory, `public/docs/<version>/`, and leaves the other version directories in `public/docs/` alone. It also writes, above them:

- `versions.json`: the version list. `search.js` reads it to fill the version menu in the header, and to show a banner on `dev/` and on releases older than the newest.
- `index.html`: a redirect to `latest/`.
- `404.html`: served for any missing path; it uses `latest/`'s stylesheet and links.

`latest/` is a copy of the newest release's directory (the first in `versions.rokon`), made by every build in which that directory is present. Canonical links of every version point at `latest/`, and `dev/` pages are `noindex`. The version menu and the banners are read from `versions.json` when a page opens, so archived pages learn of newer releases without being rebuilt.

### Archive and deploy

Old versions are never rebuilt. Each release's docs are built once, from its tags, and kept on the `docs-archive` branch of this repository (one directory per version).

```bash
# At a release, after tagging spec, impl and this repository (versions.rokon of the tag lists the version first):
ROK=<the release's rok> scripts/release-docs.sh 0.1 v0.1.0   # build from the tags, commit to docs-archive
git push origin docs-archive

# At every deploy, from main:
scripts/assemble.sh          # docs-archive → public/docs/, then build dev and the home site
# upload public/www/ as rok-lang.org and public/docs/ as docs.rok-lang.org
```

`release-docs.sh` checks the tag out in temporary worktrees of spec (`SPEC_REPO`, default `../spec`), impl (`IMPL_REPO`, default `../rok`) and this repository, builds with that tag's generator, and pushes nothing. A patch release (0.1.1) replaces its version's directory. `assemble.sh` takes `origin/docs-archive` if it was fetched, else the local branch.

## Preview

The search index (`search-index.json`) is loaded with `fetch`, so serve the two sites over HTTP rather than `file://`. For links between them to work locally, set `base_url` and `docs_url` in `site.local.rokon` to the local addresses.

```bash
python3 -m http.server -d public/www 8401    # rok-lang.org
python3 -m http.server -d public/docs 8403   # docs.rok-lang.org
```

## Configuration

Edit `site.rokon` (ROKON); `site.local.rokon`, if present, overrides its fields.

| Field         | Meaning |
|---------------|---------|
| `title`       | Site name |
| `tagline`     | Phrase appended to the home page title |
| `description` | `<meta name="description">` of the home page and of pages without a first paragraph |
| `base_url`    | Where the home site is served (`https://rok-lang.org`) |
| `docs_url`    | Where the docs are served, above the version directories (`https://docs.rok-lang.org`) |
| `spec`        | English edition of the spec (default `../spec/en`), rendered at `spec/` |
| `spec_ko`     | Korean edition (`../spec/ko`), rendered at `ko/spec/`; `""` for none |
| `spec_repo`, `spec_branch` | Repository that links pointing outside the spec directory (`../LICENSE`, etc.) resolve to |
| `packages`    | Package site URL (`https://rokstones.io`) |
| `library`     | Standard library source directory (default `../rok/library`); `install.sh` and `install.ps1` next to it are served by the home site at `/install.sh` and `/install.ps1` |
| `out`         | Output directory (default `public`) |

## Layout

| File | Contents |
|------|----------|
| `src/main.rok`   | Reads the configuration and `versions.rokon`, collects spec / pages, generates both sites, builds the search index, copies static files, checks links |
| `src/check.rok`  | Code block extraction and parallel compile / run / output comparison |
| `src/apidoc.rok` | API pages from the standard library sources |
| `src/layout.rok` | Page frames of the docs and the home site: header, version menu, navigation, chapter sidebar and table of contents, previous / next, contents listing, footer, 404 pages; markdown options |
| `www/index.md`  | The home site's landing page; `docs:<path>` links go to `<docs_url>/latest/<path>` |
| `docs/`         | The docs: home (`index.md`), guide (`learn/`), examples (`examples/`) |
| `versions.rokon` | Released docs versions, newest first |
| `scripts/`      | `release-docs.sh` (a release's docs onto `docs-archive`), `assemble.sh` (both sites for a deploy) |
| `static/`       | `style.css` (light / dark), `search.js`, logos, `og.png`; copied to both sites |

Markdown rendering (a CommonMark subset + GFM tables / strikethrough / callouts / footnotes, GitHub-compatible heading ids) and ` ```rok ` / ` ```rokon ` highlighting are handled by the stones [`markdown`](https://github.com/rok-lang/markdown) and [`rok-syntax`](https://github.com/rok-lang/rok-syntax) (path dependencies in `rok.rokon`, on the checkouts under `../stones/`). They stay path dependencies until `rok.rokon` is switched to their rokstones.io versions.

Spec files map as `x/README.md` → `spec/x/index.html` and `x/foo.md` → `spec/x/foo.html`, and `.md` links in the text are rewritten to relative paths of the generated `.html`. Anchors follow GitHub's rules, so the spec's `#...` links work unchanged. The Korean edition goes under `ko/` (`ko/spec/x/foo.html`) with `lang="ko"` and Korean callout titles; everything else is English. Every spec page carries an EN / 한국어 switch to the same page of the other edition; `search.js` carries the reader's section over, pairing headings by position when the two outlines match and by section number otherwise. The search index covers the English spec only.

`docs/x.md` becomes `<version>/x.html`. A subdirectory (`docs/learn/`) is grouped into one chapter with a sidebar and previous / next links, and a contents listing of the directory's pages (each page's title and first paragraph; cards for `examples/`) is appended after its `index.md`. Pages are ordered by file name.
