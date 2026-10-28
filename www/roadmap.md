# Roadmap

<div class="lead-sm">What is being built, in the order it ships. A version ships when its work is done; there are no dates. Every item is tracked in a <a href="https://github.com/rok-lang/rok/milestones">GitHub milestone</a>.</div>

<div class="rm-legend"><span class="rm-pill now">In progress</span><span class="rm-pill next">Next</span><span class="rm-pill later">Later</span><span class="rm-pill done">Shipped</span></div>

## In progress

<div class="rm">
<section class="rm-card now">
<header><span class="rm-ver">0.1.2</span><span class="rm-pill now">In progress</span></header>
<h3>Tooling and standard-library polish</h3>
<ul>
<li>Consistent output from the install scripts and <code>rok toolchain update</code> (<a href="https://github.com/rok-lang/rok/issues/14">#14</a>)</li>
<li>A Nix flake: <code>nix profile install</code>, <code>nix run</code> (<a href="https://github.com/rok-lang/rok/issues/34">#34</a>)</li>
<li>Standard-library fixes and ergonomics (<a href="https://github.com/rok-lang/rok/issues/15">#15</a>)</li>
<li>Compiler and library fixes from the 0.1.1 spec audit (<a href="https://github.com/rok-lang/rok/issues/84">#84</a>)</li>
</ul>
<a class="rm-link" href="https://github.com/rok-lang/rok/milestone/3">Milestone 0.1.2</a>
</section>
</div>

## Next

<div class="rm">
<section class="rm-card next">
<header><span class="rm-ver">0.1.3</span><span class="rm-pill next">Next</span></header>
<h3>Variadic functions</h3>
<ul>
<li><code>...T</code> and <code>...any</code> parameters, list and tuple spreads (<a href="https://github.com/rok-lang/rok/issues/4">#4</a>)</li>
<li>Formatting stays with f-strings: no positional <code>print("{}", x)</code></li>
</ul>
<a class="rm-link" href="https://github.com/rok-lang/rok/milestone/4">Milestone 0.1.3</a>
</section>
<section class="rm-card next">
<header><span class="rm-ver">0.1.4</span><span class="rm-pill next">Next</span></header>
<h3>More hosts</h3>
<ul>
<li>Host archives for Windows on arm64 and i686, Linux on armv7 (glibc, musl) and i686 (<a href="https://github.com/rok-lang/rok/issues/6">#6</a> to <a href="https://github.com/rok-lang/rok/issues/10">#10</a>)</li>
<li>FreeBSD: cross-compilation first, a host archive once a runner exists (<a href="https://github.com/rok-lang/rok/issues/35">#35</a>)</li>
</ul>
<a class="rm-link" href="https://github.com/rok-lang/rok/milestone/5">Milestone 0.1.4</a>
</section>
<section class="rm-card next">
<header><span class="rm-ver">0.1.5</span><span class="rm-pill next">Next</span></header>
<h3>A larger standard library</h3>
<ul>
<li>Byte encodings, more iterator and collection adapters, a public string builder, formatting into a writer (<a href="https://github.com/rok-lang/rok/issues/11">#11</a>)</li>
<li>More stones for what stays outside the core (<a href="https://github.com/rok-lang/rok/issues/12">#12</a>)</li>
</ul>
<a class="rm-link" href="https://github.com/rok-lang/rok/milestone/6">Milestone 0.1.5</a>
</section>
</div>

## Later

<div class="rm">
<section class="rm-card later">
<header><span class="rm-ver">0.2.0</span><span class="rm-pill later">Later</span></header>
<h3>First breaking release</h3>
<ul>
<li>Standard-library semantics aligned with Rust where that breaks code: the <code>char</code> digit API, iterator tie-breaks, the <code>clamp</code> precondition (<a href="https://github.com/rok-lang/rok/issues/29">#29</a>)</li>
<li><code>BinaryHeap</code> becomes <code>Send</code>: its comparator takes <code>fn(T, T) -&gt; bool + Send</code> (<a href="https://github.com/rok-lang/rok/issues/24">#24</a>)</li>
</ul>
<a class="rm-link" href="https://github.com/rok-lang/rok/milestone/2">Milestone 0.2.0</a>
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
<div class="rm-entry"><span class="rm-ver">0.1.1</span><time datetime="2026-10-27">2026-10-27</time><p><code>print(x)</code> and <code>println(x)</code> take any <code>Display</code>; <code>println()</code> prints a blank line. The REPL prints <code>Display</code>, <code>x?</code> prints <code>Debug</code>, <code>:type x</code> prints the type. <a href="https://github.com/rok-lang/rok/releases/tag/v0.1.1">Release notes</a></p></div>
<div class="rm-entry"><span class="rm-ver">0.1.0</span><time datetime="2026-10-25">2026-10-25</time><p>First public release: <code>rokc</code> with LLVM built in, <code>rok</code>, <code>rokls</code>; archives for six hosts; a REPL and a Jupyter kernel; the first stones on <a href="https://rokstones.io">rokstones.io</a>. <a href="https://github.com/rok-lang/rok/releases/tag/v0.1.0">Release notes</a></p></div>
</div>

Current release: {release}. Archives and the install script: [Download](download.html).

## Versioning

Until 1.0.0 the minor number is the breaking slot, as Cargo treats 0.x crates: **0.x.0** may break code, **0.x.y** adds features and fixes and stays compatible. The first breaking release is 0.2.0.

Missing something? Open an issue or a discussion on [GitHub](https://github.com/rok-lang/rok).
