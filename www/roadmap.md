# Roadmap

Where Rok is today and where it is headed. A version is cut when its work is ready, so the headings below are direction, not a schedule.

For specific, trackable work, follow the issues on [GitHub](https://github.com/rok-lang/rok/issues).

## Versioning

Until 1.0.0, Rok shifts semantic versioning down one level, the way Cargo treats 0.x crates. The minor number is the breaking slot and the patch number carries new features and fixes:

- **0.x.0** (minor bump) -- breaking changes.
- **0.x.y** (patch bump) -- backward-compatible features and fixes.

So 0.1.1, 0.1.2, 0.1.3 and on add features and fix bugs without breaking your code, and the first breaking release is 0.2.0.

## 0.1.0 -- now

The first public release.

- The toolchain: `rokc`, the compiler, with LLVM built in; `rok`, the package and toolchain front end; and `rokls`, the language server.
- Ahead-of-time native builds, with prebuilt archives for six hosts: macOS on Apple silicon, Linux on x86_64 and arm64 (both glibc and static musl), and Windows on x86_64. Every archive cross-compiles to the other targets with nothing more to install.
- A REPL and a Jupyter kernel.
- The first stones on [rokstones.io](https://rokstones.io), added with `rok add` and pinned in `rok.lock`.

See [Download](download.html) for the archives, the cross-compilation targets, and the install script.

## 0.1.1 -- printing and REPL ergonomics

- Print a value directly: `println(x)` and `print(x)` for any type that implements `Display`, plus a no-argument `println()` for a blank line. Today you wrap a value in an f-string first (`println(f"{x}")`).
- A friendlier REPL: entering a bare expression shows its value with `Display`; add a trailing `?` (as in `x?`) to see the `Debug` form; `:type x` shows the type.

## 0.1.2 -- tooling and standard-library polish

- Install and update that look the same: consistent, polished output from the install scripts and from `rok self update`.
- Standard-library fixes and ergonomics improvements across the existing modules.

## 0.1.3 -- variadic functions

- Variadic functions (`...T` and `...any`, with list and tuple spreads): a general language feature for user code. Formatting stays with f-strings, so there is no positional `print("{}", x)` form.

## 0.1.4 -- more host archives

- Prebuilt archives for more hosts: Windows on arm64 (`aarch64-pc-windows-msvc`) and 32-bit x86 (`i686-pc-windows-msvc`), and 32-bit Linux on Arm (`armv7`, both glibc and musl) and x86 (`i686-unknown-linux-gnu`). You can already cross-compile to these from any 0.1.0 host; this makes them hosts of their own.

## 0.1.5 -- a larger standard library

- More in-tree core breadth: byte encodings, more iterator and collection adapters, a public growable-string builder, and formatting straight into a writer.
- More published stones for functionality that lives outside the core by design.

## 0.2.0 -- first breaking release

- Standard-library semantics aligned with Rust, where that means a breaking change: the `char` digit API, iterator tie-break rules, and the `clamp` precondition.

## Later

Directions we want to explore, not tied to a version yet.

- Prebuilt archives for the remaining hosts that build from source today, such as Intel Macs.
- Richer Vim and VS Code integrations, published to their marketplaces and tracking the `rok-syntax` grammar, and support for more editors.

Want something that is not here? Open an issue or start a discussion on [GitHub](https://github.com/rok-lang/rok).
