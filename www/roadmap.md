# Roadmap

<div class="lead-sm">What is being built, in the order it ships. A version ships when its work is done; there are no dates. Every item is tracked in a <a href="https://github.com/rok-lang/rok/milestones">GitHub milestone</a>.</div>

<div class="rm-legend"><span class="rm-pill now">In progress</span><span class="rm-pill next">Next</span><span class="rm-pill later">Later</span><span class="rm-pill done">Shipped</span></div>

## In progress

<div class="rm">
<section class="rm-card now">
<header><span class="rm-ver">0.1.5</span><span class="rm-pill now">In progress</span></header>
<h3>More hosts</h3>
<ul>
<li>Host archives for Windows on arm64 and i686, Linux on armv7 (glibc, musl) and i686 (<a href="https://github.com/rok-lang/rok/issues/6">#6</a> to <a href="https://github.com/rok-lang/rok/issues/10">#10</a>)</li>
<li>FreeBSD (<a href="https://github.com/rok-lang/rok/issues/35">#35</a>)</li>
</ul>
<a class="rm-link" href="https://github.com/rok-lang/rok/milestone/5">Milestone 0.1.5</a>
</section>
</div>

## Next

<div class="rm">
<section class="rm-card next">
<header><span class="rm-ver">0.1.6</span><span class="rm-pill next">Next</span></header>
<h3>A backend interface</h3>
<ul>
<li>One documented boundary from rok-mir to code generation, so LLVM, the native backend and a future one plug in the same way (<a href="https://github.com/rok-lang/rok/issues/199">#199</a>, <a href="https://github.com/rok-lang/rok/issues/200">#200</a>)</li>
<li>Every backend checked against the corpus through it (<a href="https://github.com/rok-lang/rok/issues/201">#201</a>)</li>
</ul>
<a class="rm-link" href="https://github.com/rok-lang/rok/milestone/8">Milestone 0.1.6</a>
</section>
<section class="rm-card next">
<header><span class="rm-ver">0.2.0</span><span class="rm-pill next">Next</span></header>
<h3>First breaking release</h3>
<ul>
<li>Safety: guard escapes, double release through <code>using</code>, unsafe FFI entry points (<a href="https://github.com/rok-lang/rok/issues/104">#104</a> to <a href="https://github.com/rok-lang/rok/issues/109">#109</a>)</li>
<li><code>bare::mlir</code> and MLIR plugins go (<a href="https://github.com/rok-lang/rok/issues/167">#167</a>)</li>
<li>Language and library fixes that break code, among them semantics aligned with Rust (<a href="https://github.com/rok-lang/rok/issues/29">#29</a>) and a <code>Send</code> <code>BinaryHeap</code> (<a href="https://github.com/rok-lang/rok/issues/24">#24</a>)</li>
</ul>
<a class="rm-link" href="https://github.com/rok-lang/rok/milestone/2">Milestone 0.2.0</a>
</section>
</div>

## Later

<div class="rm">
<section class="rm-card later">
<header><span class="rm-ver">0.2.x</span><span class="rm-pill later">Later</span></header>
<h3>Variadic functions</h3>
<ul>
<li><code>...T</code> and <code>...any</code> parameters, list and tuple spreads (<a href="https://github.com/rok-lang/rok/issues/4">#4</a>)</li>
<li>Formatting stays with f-strings: no positional <code>print("{}", x)</code></li>
</ul>
<a class="rm-link" href="https://github.com/rok-lang/rok/milestone/4">Milestone 0.2.1</a>
</section>
<section class="rm-card later">
<header><span class="rm-ver">Unscheduled</span><span class="rm-pill later">Later</span></header>
<h3>Lamina backend</h3>
<ul>
<li>Lamina, a code generator in Rust, in place of LLVM: a lighter toolchain (<a href="https://github.com/rok-lang/rok/issues/159">#159</a>)</li>
<li>Opt-in first; the default once it passes every Tier 1 target, runs within 2x of LLVM and debugs in gdb, lldb and the Windows debugger</li>
</ul>
</section>
<section class="rm-card later">
<header><span class="rm-ver">Unscheduled</span><span class="rm-pill later">Later</span></header>
<h3>Editors and remaining hosts</h3>
<ul>
<li>Vim and VS Code extensions on their marketplaces, tracking the <code>rok-syntax</code> grammar (<a href="https://github.com/rok-lang/rok.vim/issues/3">rok.vim#3</a>, <a href="https://github.com/rok-lang/rok.vscode/issues/3">rok.vscode#3</a>)</li>
<li>Host archives for the remaining hosts, such as Intel Macs</li>
</ul>
</section>
</div>

## Shipped

<div class="rm-log">
<div class="rm-entry"><span class="rm-ver">0.1.4</span><time datetime="2026-10-29">2026-10-29</time><p>A better REPL: a <code>&gt;&gt;&gt;</code> prompt with the toolchain line, values in full and <code>it</code>, cell locations in errors, session commands, colours, completion, paste and history search; Jupyter streams output and asks for input. The installer sets up PATH and shell completion; the last statement before <code>}</code> may omit its <code>;</code>. <a href="https://github.com/rok-lang/rok/releases/tag/v0.1.4">Release notes</a></p></div>
<div class="rm-entry"><span class="rm-ver">0.1.3</span><time datetime="2026-10-29">2026-10-29</time><p>A larger standard library: hex and base64 encoding, more <code>str</code> splitting, iterator adapters such as <code>take_while</code>, <code>scan</code>, <code>chunks</code> and <code>unzip</code>, matching methods across the collections, <code>Writer::write_display</code>, field and variant reflection through <code>Inspect</code>, <code>int</code> bit and byte methods. API pages mark what each release added. <a href="https://github.com/rok-lang/rok/releases/tag/v0.1.3">Release notes</a></p></div>
<div class="rm-entry"><span class="rm-ver">0.1.2</span><time datetime="2026-10-28">2026-10-28</time><p>Install through Nix; package metadata in <code>rok.rokon</code>; collection traits and methods, <code>Iterator::exact_len</code>; clearer errors and fixes from the 0.1.1 spec audit. <a href="https://github.com/rok-lang/rok/releases/tag/v0.1.2">Release notes</a></p></div>
<div class="rm-entry"><span class="rm-ver">0.1.1</span><time datetime="2026-10-27">2026-10-27</time><p><code>print(x)</code> and <code>println(x)</code> take any <code>Display</code>; <code>println()</code> prints a blank line. The REPL prints <code>Display</code>, <code>x?</code> prints <code>Debug</code>, <code>:type x</code> prints the type. <a href="https://github.com/rok-lang/rok/releases/tag/v0.1.1">Release notes</a></p></div>
<div class="rm-entry"><span class="rm-ver">0.1.0</span><time datetime="2026-10-25">2026-10-25</time><p>First public release: <code>rokc</code> with LLVM built in, <code>rok</code>, <code>rokls</code>; archives for six hosts; a REPL and a Jupyter kernel; the first stones on <a href="https://rokstones.io">rokstones.io</a>. <a href="https://github.com/rok-lang/rok/releases/tag/v0.1.0">Release notes</a></p></div>
</div>

Current release: {release}. Archives and the install script: [Download](download.html).

## Versioning

Until 1.0.0 the minor number is the breaking slot, as Cargo treats 0.x crates: **0.x.0** may break code, **0.x.y** adds features and fixes and stays compatible. The first breaking release is 0.2.0.

Missing something? Open an issue or a discussion on [GitHub](https://github.com/rok-lang/rok).
