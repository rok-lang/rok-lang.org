# 1. Getting Started

In this chapter you install the rok toolchain, create and run your first package, and try a single-file script and the REPL. By the end you can run the examples in the rest of the guide yourself.

## Installation

### Prerequisites

`rokc` emits MLIR as text and produces native code with LLVM's `mlir-opt`, `mlir-translate`, and `clang` ([pipeline](../spec/refs-lang/000-meta/002-pipeline.html)). LLVM 21 and 22 are supported.

- macOS: `brew install llvm@21` and the Xcode Command Line Tools (`xcode-select --install`). `rokc` finds the Homebrew location (`/opt/homebrew/opt/llvm@21/bin`) on its own, so leave `PATH` as is. The final link is done by Xcode's clang.
- Debian / Ubuntu: `mlir-21-tools` and `clang-21` from [apt.llvm.org](https://apt.llvm.org) (`rokc` looks in `/usr/lib/llvm-21/bin`).
- If LLVM is installed elsewhere, append its `bin/` to the **end** of `PATH`. Putting it first would shadow the system `clang`: `export PATH="$PATH:/path/to/llvm/bin"`.

### Install script

The install script unpacks the toolchain into `~/.rok`. Once releases are published, installation is one line.

```bash
curl -fsSL https://rok-lang.org/install.sh | sh
```

> [!NOTE]
> There is no published release yet. For now, build a toolchain archive from source and install it with the same script. This requires a Rust toolchain (`rustup`).
>
> ```bash
> cd rok-lang/impl
> ./dist.sh                                  # dist/rok-<version>-<triple>.tar.gz
> sh install.sh --archive dist/rok-*.tar.gz  # into ~/.rok
> ```

You can change the install location with the `ROK_HOME` environment variable (default `~/.rok`). When the script finishes, you get the following layout.

```text
~/.rok/
├── bin/                        # rok, rokc, rokls proxy
└── toolchains/
    └── 0.1.0-aarch64-apple-darwin/
        ├── bin/{rok, rokc, rokls}
        └── lib/                # runtime and standard library sources
```

The toolchain you just installed becomes the default. The three executables in `~/.rok/bin` are **proxies**: the real work is done by the executable of the same name in the active toolchain. This lets you install several toolchains side by side and pick one (the same approach as rustup). Add this directory to `PATH`.

```bash
# bash / zsh
echo 'export PATH="$HOME/.rok/bin:$PATH"' >> ~/.zshrc
# fish
fish_add_path ~/.rok/bin
```

Check the version in a new shell.

```bash
rok --version
rok toolchain list
```

Three executables are installed.

| Executable | What it does |
|------------|--------------|
| `rokc`     | The compiler. Build, run, test, format ([9.1](../spec/refs-lang/009-tools/901-rokc-cli.html)) |
| `rok`      | Package / build front-end. `rok.rokon`, dependencies, environments, REPL, Jupyter ([9.10](../spec/refs-lang/009-tools/910-rok-frontend.html)) |
| `rokls`    | Language server (LSP) |

### Managing toolchains

`rok toolchain` manages installed toolchains. The active toolchain is chosen, in order, by `+version` on the command line (`rok +0.1 build`), the `ROK_TOOLCHAIN` environment variable, the `toolchain` field of the nearest `rok.rokon`, and finally the default.

```bash
rok toolchain list                     # installed toolchains
rok toolchain default 0.1.0            # change the default
rok toolchain install 0.2.0 --from rok-0.2.0-aarch64-apple-darwin.tar.gz
```

### Using the source tree directly

If you are working on the compiler, you can use the build output directly without installing.

```bash
cd rok-lang/impl
cargo build --release
export PATH="$PWD/target/release:$PATH"
```

## Your first package

`rok new` creates a package directory and initializes a git repository with a `.gitignore` that excludes `target/`. Package names use lowercase letters, digits, `-`, and `_`, and start with a letter. In code, `-` becomes `_` (`rok new my-lib` is imported as `use my_lib::..`).

```bash
rok new hello
cd hello
```

```text
     Created executable package (hello)
```

There are two source files. The manifest `rok.rokon` holds the package name, version, and dependencies.

```rokon
Package { name: "hello", version: "0.1.0", deps: {} }
```

`main.rok` is a single line that prints a greeting.

```rok
println("Hello, world!");
```

```output
Hello, world!
```

`rok run` builds and runs it. The output goes to `target/debug/`.

```bash
rok run
```

```text
   Compiling hello (.)
    Finished in 1.55s
     Running `./target/debug/hello`
Hello, world!
```

The top-level statements in `main.rok` run from top to bottom and form the program. Function and type declarations can go anywhere between top-level statements. Other common commands are `rok build` (build only), `rok check` (type check only), `rok test`, and `rok fmt`.

## A slightly bigger program

Change `main.rok` to the following and run `rok run` again.

```rok
let names = ["ada", "grace", "linus"];
for name in names {
    greet(name);
}
println(f"{names.len()} people greeted");

fn greet(name: str) {
    println(f"Hello, {name}!");
}
```

```output
Hello, ada!
Hello, grace!
Hello, linus!
3 people greeted
```

`f"..."` is a format string: each expression inside `{}` is evaluated and inserted in place. `greet` is declared below its use, yet the call works, because declarations such as functions are visible regardless of order.

Instead of top-level statements, you can use `fn main()` as the entry point. Use one or the other.

```rok
fn main() {
    let total = add(2, 3);
    println(f"2 + 3 = {total}");
}

fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

```output
2 + 3 = 5
```

## Single-file scripts

Quick experiments don't need a package. Give `rok run` a file path and it runs that file on its own.

```bash
echo 'println("hi");' > hi.rok
rok run hi.rok
```

```text
   Compiling hi (.)
    Finished in 1.52s
     Running `/tmp/rokc-.../hi`
hi
```

Scripts can use dependencies too. To write a manifest in a `//!` comment at the top of the file, see [inline manifests](../spec/refs-lang/009-tools/910-rok-frontend.html).

## REPL

Running `rok` with no arguments opens the REPL. Enter an expression or a `let` and it shows the value and type.

```text
$ rok
> let xs = [1, 2, 3];
List<i32>: [1, 2, 3]
> xs.len() * 2
usize: 6
> :type xs
List<i32>
> :quit
```

`:type expr` reports the type of an expression without running it. Whenever you wonder about a type while reading this guide, check it in the REPL. Unlike regular source, the REPL lets you redeclare the same name with `let` ([JIT cells](../spec/refs-lang/009-tools/907-jit-cells.html)).

## Summary

- Install into `~/.rok` with `curl -fsSL https://rok-lang.org/install.sh | sh` and add `~/.rok/bin` to `PATH`.
- `rok new name` creates `rok.rokon` and `main.rok`; `rok run` builds and runs.
- The top-level statements of `main.rok` are the program. You can also use `fn main()`.
- `rok run file.rok` runs a script; `rok` alone starts the REPL.

The next chapter, [2. Values and Types](02-values-and-types.html), covers variables and basic types.

## Further reading

- [Install layout](../spec/refs-lang/009-tools/902-aot-pipeline.html#9219-installation-layout), [pinning the toolchain](../spec/refs-lang/009-tools/910-rok-frontend.html#9106-toolchain)
- [`rok` front-end](../spec/refs-lang/009-tools/910-rok-frontend.html), [`rokc` CLI](../spec/refs-lang/009-tools/901-rokc-cli.html)
- [Entry point](../spec/refs-lang/004-functions/416-entry-point.html)
- [JIT cells and the REPL](../spec/refs-lang/009-tools/907-jit-cells.html)
