# Download rok

<div class="lead-sm">rok {release}: one line installs it, or take an archive below. The toolchain is self-contained, with LLVM and the linker built in.</div>

## Install script

macOS and Linux:

```sh
curl -fsSL https://rok-lang.org/install.sh | sh
```

Windows, in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://rok-lang.org/install.ps1 | iex"
```

The script picks the archive for your machine, checks its SHA-256 and unpacks it into `~/.rok` (Windows: `%USERPROFILE%\.rok`). `install.sh --version <v>` and `install.ps1 -Version <v>` pick another release.

## Archives

<div class="dl">
<div class="dl-os"><span class="dl-glyph os-apple" aria-hidden="true"></span><h3>macOS</h3><p>Apple silicon</p><code>aarch64-apple-darwin</code><div class="dl-links"><a class="primary" href="https://github.com/rok-lang/rok/releases/download/v{release}/rok-{release}-aarch64-apple-darwin.tar.xz">.tar.xz</a><a href="https://github.com/rok-lang/rok/releases/download/v{release}/rok-{release}-aarch64-apple-darwin.tar.gz">.tar.gz</a></div><p class="dl-sum"><a href="https://github.com/rok-lang/rok/releases/download/v{release}/rok-{release}-aarch64-apple-darwin.tar.xz.sha256">sha256</a></p></div>
<div class="dl-os"><span class="dl-glyph os-linux" aria-hidden="true"></span><h3>Linux</h3><p>x86_64, glibc 2.34+</p><code>x86_64-unknown-linux-gnu</code><div class="dl-links"><a class="primary" href="https://github.com/rok-lang/rok/releases/download/v{release}/rok-{release}-x86_64-unknown-linux-gnu.tar.xz">.tar.xz</a><a href="https://github.com/rok-lang/rok/releases/download/v{release}/rok-{release}-x86_64-unknown-linux-gnu.tar.gz">.tar.gz</a></div><p class="dl-sum"><a href="https://github.com/rok-lang/rok/releases/download/v{release}/rok-{release}-x86_64-unknown-linux-gnu.tar.xz.sha256">sha256</a></p></div>
<div class="dl-os"><span class="dl-glyph os-linux" aria-hidden="true"></span><h3>Linux</h3><p>arm64, glibc 2.34+</p><code>aarch64-unknown-linux-gnu</code><div class="dl-links"><a class="primary" href="https://github.com/rok-lang/rok/releases/download/v{release}/rok-{release}-aarch64-unknown-linux-gnu.tar.xz">.tar.xz</a><a href="https://github.com/rok-lang/rok/releases/download/v{release}/rok-{release}-aarch64-unknown-linux-gnu.tar.gz">.tar.gz</a></div><p class="dl-sum"><a href="https://github.com/rok-lang/rok/releases/download/v{release}/rok-{release}-aarch64-unknown-linux-gnu.tar.xz.sha256">sha256</a></p></div>
<div class="dl-os"><span class="dl-glyph os-windows" aria-hidden="true"></span><h3>Windows</h3><p>x86_64</p><code>x86_64-pc-windows-msvc</code><div class="dl-links"><a class="primary" href="https://github.com/rok-lang/rok/releases/download/v{release}/rok-{release}-x86_64-pc-windows-msvc.zip">.zip</a></div><p class="dl-sum"><a href="https://github.com/rok-lang/rok/releases/download/v{release}/rok-{release}-x86_64-pc-windows-msvc.zip.sha256">sha256</a></p></div>
</div>

Each archive has a `.sha256` beside it. Check it, then install from the archive:

```sh
shasum -a 256 -c rok-{release}-aarch64-apple-darwin.tar.xz.sha256
sh install.sh --archive rok-{release}-aarch64-apple-darwin.tar.xz
```

The `.tar.xz` is about half the size of the `.tar.gz`; on Linux, tar needs `xz` to unpack it. An unpacked archive also installs itself with its own `install.sh` (Windows: `install.ps1`).

## Cross-compilation targets

You download one archive for your own machine; it builds for the rest. Every release archive carries the runtime and linker for these targets, so `rok build --target <triple>` (or `--target` on `rok run`) produces a binary for any of them without anything more to install:

| Target | Triple |
|---|---|
| Linux x86_64, glibc 2.34+ | `x86_64-unknown-linux-gnu` |
| Linux arm64, glibc 2.34+ | `aarch64-unknown-linux-gnu` |
| Linux x86 (32-bit), glibc 2.34+ | `i686-unknown-linux-gnu` |
| Linux armv7 hard-float, glibc 2.34+ | `armv7-unknown-linux-gnueabihf` |
| Linux riscv64, glibc 2.34+ | `riscv64gc-unknown-linux-gnu` |
| Linux x86_64, static (musl 1.2.5) | `x86_64-unknown-linux-musl` |
| Linux arm64, static (musl 1.2.5) | `aarch64-unknown-linux-musl` |
| Windows x86_64 | `x86_64-pc-windows-msvc` |
| Windows arm64 | `aarch64-pc-windows-msvc` |
| Windows x86 (32-bit) | `i686-pc-windows-msvc` |
| WebAssembly, WASI preview 2 | `wasm32-wasi` |
| WebAssembly, WASI with threads | `wasm32-wasi-threads` |
| WebAssembly, browser / freestanding | `wasm32-unknown-unknown` |

The macOS archive adds `aarch64-apple-darwin` and `x86_64-apple-darwin` (they link against the Xcode Command Line Tools SDK, so only a macOS host builds them). These are the targets a release ships a runtime and linker for, so they build with nothing more installed; `rokc --print target-list` also lists the other triples the code generator knows, for which you supply the runtime yourself.

## What else you need

- macOS: the Xcode Command Line Tools (`xcode-select --install`), for the SDK that linking needs.
- Linux: nothing; glibc 2.34 or later (Ubuntu 22.04, Debian 12, RHEL 9 and newer).
- Windows: nothing.

Other hosts, such as Intel Macs and Windows on arm64, have no release archive yet: [build rok from source](https://github.com/rok-lang/rok#building-from-source). Every release, with its notes, is on [GitHub](https://github.com/rok-lang/rok/releases). Next: [Getting started](docs:learn/01-getting-started.html).

<div class="credit">Platform icons: <a href="https://fontawesome.com">Font Awesome Free</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>). Apple, Linux and Windows are trademarks of their owners.</div>
