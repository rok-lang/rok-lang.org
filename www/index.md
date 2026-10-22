<div class="hero">
<img src="logo.svg" alt="rok logo">

# rok

<div class="lead">A small language with a rich library.<br>Static types, closed sum types, AOT compilation, plus a REPL and Jupyter.</div>
<div class="cta"><a class="primary" href="docs:learn/01-getting-started.html">Get started</a><a href="docs:index.html">Docs</a></div>
<div class="install"><pre><code>curl -fsSL https://rok-lang.org/<wbr>install.sh | sh</code></pre><p>macOS and Linux. Windows and archives: <a href="download.html">Download</a>.</p></div>
<div class="term" aria-label="A terminal: rok new hello, then rok run prints Hello, world!" role="img">
<div class="term-bar"><i></i><i></i><i></i><span>~/code</span><button class="term-again" type="button" hidden>↻ again</button></div>
<pre><span class="l" style="--d:0s"><b>$</b> <span class="type" style="--n:13">rok new hello</span></span>
<span class="l o" style="--d:1.1s"><em>     Created</em> executable package (hello)</span>
<span class="l" style="--d:1.6s"><b>$</b> <span class="type" style="--n:20">cd hello &amp;&amp; rok run</span></span>
<span class="l o" style="--d:3s"><em>   Compiling</em> hello (.)</span>
<span class="l o" style="--d:3.4s"><em>    Finished</em> in 0.39s</span>
<span class="l o" style="--d:3.8s"><em>     Running</em> `./target/debug/hello`</span>
<span class="l out" style="--d:4.3s">Hello, world!</span>
<span class="l" style="--d:4.8s"><b>$</b> <span class="cursor"></span></span></pre>
</div>
</div>

<div class="tiles">
<div class="tile"><code class="glyph">A | B</code><h3>Closed sum types</h3><p>An <code>enum</code> or <code>T | none</code> names every case, and <code>match</code> checks that you handled them all.</p></div>
<div class="tile"><code class="glyph">??</code><h3>No null surprises</h3><p>A missing value is <code>none</code> in the type; <code>??</code> gives the default.</p></div>
<div class="tile"><code class="glyph">throws</code><h3>Errors you can see</h3><p><code>throws (E)</code> is part of the signature; the caller writes <code>try</code> or <code>catch</code>.</p></div>
<div class="tile"><code class="glyph">AOT</code><h3>Native programs</h3><p>Compiled ahead of time, with LLVM built into <code>rokc</code>: nothing else to install.</p></div>
<div class="tile"><code class="glyph">&gt;_</code><h3>REPL and Jupyter</h3><p>Try an idea at the prompt or in a notebook, then keep it as a script.</p></div>
<div class="tile"><code class="glyph">◎</code><h3>Stones</h3><p>Packages from <a href="https://rokstones.io">rokstones.io</a>, added with <code>rok add</code> and pinned in <code>rok.lock</code>.</p></div>
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
