<div class="hero">
<img src="logo.png" alt="rok logo">

# rok

<div class="lead">A small language with a rich library.<br>Static types, closed sum types, AOT compilation, plus a REPL and Jupyter.</div>
<div class="cta"><a class="primary" href="learn/01-getting-started.html">Get started</a><a href="learn/index.html">Learn rok</a><a href="examples/index.html">Examples</a><a href="spec/refs-lang/index.html">Language reference</a><a href="std/index.html">API</a></div>
</div>

## What is rok

rok is a programming language that aims to be "one language for everything you want to do". Its design follows two slogans.

- **A small language, a rich library.** Most of what defines how a language feels (numeric semantics, conversions, collections, IO, concurrency) lives in the standard library.
- **Freedom within control.** Static types, closed sum types, no traits-as-types, no implicit promotion, and AOT-only compilation narrow the paths you can take; in exchange, the code within them is predictable.

The full motivation and philosophy are in the [spec introduction](spec/index.html).

## At a glance

Sum types and `match`, `T | none` and `??`, and error flow made explicit with `throws` / `try` / `catch`.

```rok
enum Shape {
    Circle(f64),
    Rect { w: f64; h: f64; },
}

fn area(s: Shape) -> f64 {
    match s {
        Shape::Circle(r) => 3.14159 * r * r,
        Shape::Rect { w, h } => w * h,
    }
}

fn find(xs: List<str>, key: str) -> usize | none {
    for i in 0..xs.len() {
        if xs[i] == key { return i; }
    }
    none
}

fn parse_port(s: str) throws (ParseError) -> u16 {
    try s.parse::<u16>()
}

fn main() {
    let shapes = [Shape::Circle(1.0), Shape::Rect { w: 2.0, h: 3.0 }];
    for s in shapes { println(f"area = {area(s):.2}"); }

    let at = find(["ada", "grace", "linus"], "grace") ?? 99;
    println(f"grace at {at}");

    let port = try parse_port("80x") catch e { 8080u16 };
    println(f"port {port}");
}
```

```output
area = 3.14
area = 6.00
grace at 1
port 8080
```

A one-line script runs as is.

```rok
println("Hello, world!");
```

```output
Hello, world!
```

<div class="cards">
<div class="card">

### Learn rok

Sixteen chapters, from installation and values and types to error handling, modules, concurrency, IO, FFI, and tools. Every code sample runs. [Learn rok](learn/index.html)

</div>
<div class="card">

### Examples

Small complete programs: CLI tools, file processing, a TCP echo server, parallel map, an interpreter, and more. [Examples](examples/index.html)

</div>
<div class="card">

### Language reference

Ten chapters, from lexical structure through types, expressions, modules, the meta system, the runtime, and the ABI. [Language reference](spec/refs-lang/index.html)

</div>
<div class="card">

### Standard library

The [specification](spec/refs-standard-libraries/index.html) of the three tiers `bare` / `core` / `std`, and the [API listing](std/index.html) generated from the sources.

</div>
<div class="card">

### Tools

The `rokc` compiler, the `rok` package tool, the REPL, the Jupyter kernel, the LSP server, and debugging tools. [Tools](spec/refs-lang/009-tools/index.html)

</div>
</div>

## Packages

rok packages are called stones. Add a stone from the [rokstones.io](https://rokstones.io) registry as a dependency with `rok add <name>`, or a local path or git repository with `rok add <name> --path <dir>` / `--git <url>`. See [Modules and Packages](learn/11-modules-packages.html) for details.
