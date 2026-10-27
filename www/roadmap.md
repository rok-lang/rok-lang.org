# Roadmap

Where Rok is and where it is going. A version ships when its work is ready; the headings are direction, not dates. Trackable work is in the [GitHub issues](https://github.com/rok-lang/rok/issues).

## Versioning

Until 1.0.0 the minor number is the breaking slot, as Cargo treats 0.x crates:

- **0.x.0**: breaking changes.
- **0.x.y**: features and fixes, backward compatible.

The first breaking release is 0.2.0.

## 0.1.0

The first public release.

- `rokc`, the compiler with LLVM built in; `rok`, the package and toolchain front end; `rokls`, the language server.
- Native builds, with prebuilt archives for six hosts: macOS on Apple silicon, Linux on x86_64 and arm64 (glibc and static musl), Windows on x86_64. Each archive cross-compiles to the other targets.
- A REPL and a Jupyter kernel.
- The first stones on [rokstones.io](https://rokstones.io), added with `rok add` and pinned in `rok.lock`.

## 0.1.1 (current)

- `print(x)` and `println(x)` take any `Display` value; `println()` prints a blank line.
- REPL: a bare expression prints with `Display`, `x?` prints `Debug`, `:type x` prints the type.

Archives and the install script: [Download](download.html).

## 0.1.2: tooling and standard-library polish

- Consistent output from the install scripts and `rok self update`.
- A Nix flake, for `nix profile install` and `nix run`.
- Standard-library fixes and ergonomics.
- Compiler and library fixes from the 0.1.1 spec audit ([#84](https://github.com/rok-lang/rok/issues/84)).

## 0.1.3: variadic functions

- `...T` and `...any`, with list and tuple spreads. Formatting stays with f-strings; there is no positional `print("{}", x)`.

## 0.1.4: more hosts

- Host archives for Windows on arm64 and i686, and Linux on armv7 (glibc and musl) and i686. All of them are cross-compile targets already.
- FreeBSD (`x86_64-unknown-freebsd`): cross-compilation first, a host archive once a runner is available.

## 0.1.5: a larger standard library

- Byte encodings, more iterator and collection adapters, a public string builder, formatting into a writer.
- More stones for what stays outside the core.

## 0.2.0: first breaking release

- Standard-library semantics aligned with Rust where that breaks code: the `char` digit API, iterator tie-breaks, the `clamp` precondition.

## Later

- Host archives for the remaining hosts, such as Intel Macs.
- Vim and VS Code extensions on their marketplaces, tracking the `rok-syntax` grammar; more editors.

Missing something? Open an issue or a discussion on [GitHub](https://github.com/rok-lang/rok).
