<div class="hero">
<img src="logo.svg" alt="rok logo">

# rok

<div class="lead">A small language with a rich library.<br>Static types, closed sum types, AOT compilation, plus a REPL and Jupyter.</div>
<div class="cta"><a class="primary" href="docs:learn/01-getting-started.html">Get started</a><a href="docs:index.html">Docs</a></div>
<div class="install"><pre><code>curl -fsSL https://rok-lang.org/install.sh | sh</code></pre><p>macOS and Linux. On Windows, use <a href="docs:learn/01-getting-started.html#install-script">install.ps1</a>.</p></div>
</div>

## What is rok

rok is a programming language that aims to be "one language for everything you want to do". Its design follows two slogans.

- **A small language, a rich library.** Most of what defines how a language feels (numeric semantics, conversions, collections, IO, concurrency) lives in the standard library.
- **Freedom within control.** Static types, closed sum types, no traits-as-types, no implicit promotion, and AOT-only compilation narrow the paths you can take; in exchange, the code within them is predictable.

The full motivation and philosophy are in the [spec introduction](docs:spec/index.html).

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
<a class="card" href="docs:learn/index.html"><span class="tag">learn/</span><h3>Learn rok</h3><p>Twenty chapters, from installation to concurrency, FFI, stones, and a cookbook. Every code sample is checked when the site is built.</p></a>
<a class="card" href="docs:examples/index.html"><span class="tag">examples/</span><h3>Examples</h3><p>Small complete programs: CLI tools, file processing, a TCP echo server, parallel map, an interpreter, and more.</p></a>
<a class="card" href="docs:spec/refs-lang/index.html"><span class="tag">spec/</span><h3>Language reference</h3><p>Ten chapters, from lexical structure through types, expressions, modules, the meta system, the runtime, and the ABI.</p></a>
<a class="card" href="docs:spec/refs-standard-libraries/index.html"><span class="tag">std/</span><h3>Standard library</h3><p>The specification of the three tiers <code>bare</code> / <code>core</code> / <code>std</code>, with an API listing generated from the sources.</p></a>
<a class="card" href="docs:spec/refs-lang/009-tools/index.html"><span class="tag">tools/</span><h3>Tools</h3><p>The <code>rokc</code> compiler, the <code>rok</code> package tool, the REPL, the Jupyter kernel, the LSP server, and debugging tools.</p></a>
<a class="card" href="https://rokstones.io"><span class="tag">stones/</span><h3>Packages</h3><p>Stones, rok's packages, live on rokstones.io. Add one with <code>rok add &lt;name&gt;</code>.</p></a>
</div>

## Packages

rok packages are called stones. Add a stone from the [rokstones.io](https://rokstones.io) registry as a dependency with `rok add <name>`, or a local path or git repository with `rok add <name> --path <dir>` / `--git <url>`. See [Modules and Packages](docs:learn/11-modules-packages.html) for details.
