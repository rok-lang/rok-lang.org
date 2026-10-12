# rok-lang.org

The documentation site for the rok language. The site generator itself is written in rok. It reads both editions of the spec repository, English (`spec/en`, rendered at `/spec/`) and Korean (`spec/ko`, rendered at `/ko/spec/`), to build the language reference and the standard library reference, extracts the API listing (`/std/`) from the standard library sources of the implementation repository (`impl/library`), adds the landing page, the guide (`/learn/`), and the examples (`/examples/`) from this repository's `pages/`, and writes a static site to `public/`.

## Build

You need the rok toolchain (`rok`, `rokc`) and the `rok-lang` repository (spec and standard library sources). The default configuration assumes the repositories sit side by side.

```
Works/
├── rok-lang/          # impl/ (toolchain, impl/library standard library), spec/en/ + spec/ko/ (spec)
├── stones/rok-markdown/   # markdown renderer stone (path dependency)
├── stones/rok-syntax/     # rok / RokON highlighter stone (path dependency)
└── rok-lang.org/      # this repository
```

If you have no toolchain, build it first.

```bash
cd ../rok-lang/impl
cargo build --release
export PATH="$PWD/target/release:$PATH"
```

Then, in this repository:

```bash
rok run                      # generate the site in public/ (spec + guide + examples + API)
rok run -- check             # generate + run code blocks; exit code 1 on broken links or failed blocks
rok run -- code [filter]     # run code blocks only (pages whose path contains filter); leaves public/ alone
rok test                     # code block extraction tests
```

When the build finishes it prints the page count, the broken link count, and the elapsed time. The link check re-reads the generated HTML every time and verifies that the target file and `#anchor` of every `href` / `src` exist. Generation alone takes 1–5 seconds; `check` compiles and runs hundreds of code blocks in parallel and takes about 1–3 minutes depending on the machine.

### Code block checks

Every ` ```rok ` block in the markdown under `pages/` is compiled and run as a standalone program (`rokc run <block>.rok`, in `rok-lang.org-snippets/` under the system temp directory). The second word of the info string changes the behavior.

| Block | Check |
|-------|-------|
| ` ```rok `        | Compile and run; must exit with code 0 |
| ` ```rok build `  | Compile only (servers, programs that read stdin, and so on) |
| ` ```rok norun `  | Not checked (fragments, examples blocked by toolchain bugs) |

A ` ```output ` block right after a run block is the expected stdout. It must match exactly, ignoring trailing whitespace. On the page it shows as an "Output" box below the code. Stdin is empty, there are no arguments, and each block has a 60-second limit. The toolchain is taken from the `ROKC` environment variable, or `rokc` on `PATH`.

### Standard library API

Starting from `lib.rok` of `bare` / `core` / `std` under `library` in `site.rokon` (default `../rok-lang/impl/library`), the generator follows `pub mod` and builds one page per module (`std/<tier>/<module path>.html`). It shows the signatures of `pub` items as written, uses the `///` comment right above as documentation, and uses the file's first comment block as the module description. Members of structs / enums / traits / inherent `impl`s and the list of trait implementations are included. Items and methods go into the search index.

Why not `rokc doc`: `rokc doc` documents only the user package and `--extern` dependencies and skips the `rok::` standard library, and the standard library does not compile as a user package (lang slots, type keywords, `rok::core` paths). So `apidoc.rok` scans the sources directly (it masks comments / strings, then finds item boundaries by bracket depth).

## Preview

The search index (`search-index.json`) is loaded with `fetch`, so open the site through a local server rather than `file://`.

```bash
python3 -m http.server -d public 8000
# http://localhost:8000
```

## Configuration

Edit `site.rokon` (RokON).

| Field         | Meaning |
|---------------|---------|
| `title`       | Site name |
| `tagline`     | Phrase appended to the home page title |
| `spec`        | English edition of the spec (default `../rok-lang/spec/en`), rendered at `spec/` |
| `spec_ko`     | Korean edition (`../rok-lang/spec/ko`), rendered at `ko/spec/`; `""` for none |
| `spec_repo`, `spec_branch` | Repository that links pointing outside the spec directory (`../LICENSE`, etc.) resolve to |
| `packages`    | Package site URL (`https://rokstones.io`) |
| `library`     | Standard library source directory (default `../rok-lang/impl/library`) |
| `out`         | Output directory (default `public`) |

## Layout

| File | Contents |
|------|----------|
| `main.rok`      | Reads the configuration, collects spec / pages, generates pages, builds the search index, copies static files, checks links |
| `check.rok`     | Code block extraction and parallel compile / run / output comparison |
| `apidoc.rok`    | API pages from the standard library sources |
| `layout.rok`    | Page frame: header, navigation, chapter sidebar and table of contents, previous / next, contents listing, footer; markdown options |
| `pages/`        | Landing page (`index.md`), guide (`learn/`), examples (`examples/`) |
| `static/`       | `style.css` (light / dark), `search.js`, logo |

Markdown rendering (a CommonMark subset + GFM tables / strikethrough / callouts / footnotes, GitHub-compatible heading ids) and ` ```rok ` / ` ```rokon ` highlighting are handled by the stones [`rok-markdown`](https://github.com/rok-lang/rok-markdown) and [`rok-syntax`](https://github.com/rok-lang/rok-syntax) (path dependencies in `rok.rokon`). They become version dependencies once published to rokstones.io.

Spec files map as `x/README.md` → `spec/x/index.html` and `x/foo.md` → `spec/x/foo.html`, and `.md` links in the text are rewritten to relative paths of the generated `.html`. Anchors follow GitHub's rules, so the spec's `#...` links work unchanged. The Korean edition goes under `ko/` (`ko/spec/x/foo.html`) with `lang="ko"` and Korean callout titles; everything else is English. Every spec page carries an EN / 한국어 switch to the same page of the other edition; `search.js` carries the reader's section over, pairing headings by position when the two outlines match and by section number otherwise. The search index covers the English spec only.

`pages/x.md` becomes `x.html`. A subdirectory (`pages/learn/`) is grouped into one chapter with a sidebar and previous / next links, and a contents listing of the directory's pages (each page's title and first paragraph; cards for `examples/`) is appended after its `index.md`. Pages are ordered by file name.
