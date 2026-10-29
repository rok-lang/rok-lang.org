// Client-side search over search-index.json: {p: [[title, url]], h:
// [[page, heading, id, named?]]}, read into [{t: title, u: url, p: page}].
(() => {
  const root = document.body.dataset.root || "";
  const q = document.getElementById("q");
  const box = document.getElementById("results");
  let index = null;
  let sel = -1;

  // The sidebar starts folded on small screens; on wide ones it scrolls
  // to the current page (the API list is long).
  const side = document.querySelector(".side details");
  if (side && matchMedia("(max-width: 860px)").matches) side.open = false;
  const aside = document.querySelector(".side");
  const hereItem = aside && aside.querySelector("[aria-current=page], a.cur");
  if (hereItem && aside.scrollHeight > aside.clientHeight) {
    aside.scrollTop = hereItem.offsetTop - aside.clientHeight / 2;
  }

  // Theme button: auto (the system setting) -> light -> dark. The choice
  // is this reader's alone, so it lives in localStorage; the inline
  // script in <head> applies it before the page paints.
  const tb = document.querySelector(".theme");
  if (tb) {
    const order = ["auto", "light", "dark"];
    const glyph = { auto: "◐", light: "☀", dark: "☾" };
    const get = () => { try { return localStorage.getItem("theme") || "auto"; } catch { return "auto"; } };
    const show = (t) => {
      tb.textContent = glyph[t];
      tb.setAttribute("aria-label", `Theme: ${t}`);
      tb.title = `Theme: ${t}`;
    };
    show(get());
    tb.addEventListener("click", () => {
      const t = order[(order.indexOf(get()) + 1) % order.length];
      try { t === "auto" ? localStorage.removeItem("theme") : localStorage.setItem("theme", t); } catch {}
      if (t === "auto") delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = t;
      show(t);
    });
  }

  // Compact header: the hamburger opens the nav as a drop panel. It
  // closes on a link, an outside click, Escape, or a return to the full nav.
  const top = document.querySelector(".top");
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("nav");
  if (top && navToggle && nav) {
    const setNav = (open) => {
      top.classList.toggle("nav-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    navToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      setNav(!top.classList.contains("nav-open"));
    });
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setNav(false); });
    document.addEventListener("click", (e) => {
      if (top.classList.contains("nav-open") && !e.target.closest(".nav-toggle, #nav")) setNav(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && top.classList.contains("nav-open")) { setNav(false); navToggle.focus(); }
    });
    // Collapse exactly when the full nav would not fit on one row: measure
    // the natural width with the row forced not to wrap or shrink. Works
    // for any number of links, so there is no per-page width breakpoint.
    const fitNav = () => {
      top.classList.remove("nav-compact");
      top.classList.add("nav-measuring");
      const overflow = top.scrollWidth > top.clientWidth + 1;
      top.classList.remove("nav-measuring");
      if (overflow) top.classList.add("nav-compact");
      else setNav(false);
    };
    fitNav();
    addEventListener("resize", fitNav);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNav);
  }

  // Spec language switch: carry the current section over to the other
  // edition (data-sec pairs this page's heading ids with the other's).
  const sw = document.querySelector(".lang-switch[data-sec]");
  const other = sw && sw.querySelector("a[hreflang]");
  if (other) {
    const ids = sw.dataset.sec.split(" ");
    const map = {};
    for (let i = 0; i + 1 < ids.length; i += 2) map[ids[i]] = ids[i + 1];
    other.addEventListener("click", () => {
      let id = decodeURIComponent(location.hash.slice(1));
      if (!map[id]) {
        id = "";
        for (const h of document.querySelectorAll("article [id]")) {
          if (h.getBoundingClientRect().top > 80) break;
          if (map[h.id]) id = h.id;
        }
      }
      other.href = other.href.split("#")[0] + (map[id] ? "#" + map[id] : "");
    });
  }

  // A block runs in the playground when it has `fn main`, or a top-level
  // statement rok runs as the script body (helpers beside it are fine).
  // A block of only declarations (a lone `enum`, a signature) would just
  // error there, so it gets no try button.
  const runnableRok = (src) => {
    if (/\bfn\s+main\s*\(/.test(src)) return true;
    let depth = 0;
    for (const line of src.split("\n")) {
      const t = line.trim();
      if (depth === 0 && t && !t.startsWith("//") && !t.startsWith("}") &&
          !/^(pub\s+)?(fn|struct|enum|trait|impl|type|const|static|mod|use)\b/.test(t)) {
        return true;
      }
      for (const c of line) { if (c === "{") depth++; else if (c === "}") depth = Math.max(0, depth - 1); }
    }
    return false;
  };

  // A copy button on each code block (not on output or error boxes).
  for (const pre of document.querySelectorAll("article pre:not(.output):not(.err):not(.sig), .install pre")) {
    if (pre.closest(".members, .term")) continue;
    const wrap = document.createElement("div");
    wrap.className = "code";
    // try and copy sit together in the header strip, above the code.
    const tools = document.createElement("div");
    tools.className = "code-tools";
    // Its language in the corner, as the fence named it.
    const lang = (pre.querySelector("code")?.className.match(/language-(\w+)/) || [])[1];
    if (lang && lang !== "text" && !pre.closest(".install")) wrap.dataset.lang = lang;
    // A whole rok program opens in the playground, its code in the link.
    const play = document.body.dataset.play;
    if (play && lang === "rok" && runnableRok(pre.innerText) && "CompressionStream" in window) {
      const t = document.createElement("button");
      t.type = "button";
      t.className = "copy try";
      t.textContent = "▶ try";
      t.setAttribute("aria-label", "Open in the playground");
      t.addEventListener("click", async () => {
        const s = new Blob([pre.innerText]).stream().pipeThrough(new CompressionStream("deflate-raw"));
        const b = new Uint8Array(await new Response(s).arrayBuffer());
        const code = btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        window.open(`${play}/#code=${code}`, "_blank", "noopener");
      });
      tools.append(t);
    }
    pre.replaceWith(wrap);
    wrap.append(pre);
    const b = document.createElement("button");
    b.type = "button";
    b.className = "copy";
    b.textContent = "copy";
    b.setAttribute("aria-label", "Copy code");
    b.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText.replace(/\n$/, ""));
        b.textContent = "copied ✓";
      } catch {
        b.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? "press ⌘C" : "press Ctrl+C";
      }
      b.classList.add("done");
      setTimeout(() => { b.textContent = "copy"; b.classList.remove("done"); }, 1600);
    });
    tools.append(b);
    // A language'd block gets a macOS-style title bar: traffic lights, the
    // language, then the tools. Plain and install blocks keep the floating
    // tools (positioned by CSS).
    if (wrap.dataset.lang && !pre.closest(".install")) {
      const head = document.createElement("div");
      head.className = "code-head";
      const lights = document.createElement("span");
      lights.className = "lights";
      lights.setAttribute("aria-hidden", "true");
      for (let i = 0; i < 3; i++) lights.append(document.createElement("i"));
      const title = document.createElement("span");
      title.className = "code-title";
      title.textContent = wrap.dataset.lang;
      head.append(lights, title, tools);
      wrap.prepend(head);
    } else {
      wrap.append(tools);
    }

    // A very tall block collapses behind a "show all" bar.
    if (!pre.closest(".install") && pre.scrollHeight > 460) {
      const lines = pre.innerText.replace(/\n$/, "").split("\n").length;
      wrap.classList.add("tall", "collapsed");
      const ex = document.createElement("button");
      ex.type = "button";
      ex.className = "expand";
      const label = () => { ex.textContent = wrap.classList.contains("collapsed") ? `\u25BE show all ${lines} lines` : "\u25B4 collapse"; };
      label();
      ex.addEventListener("click", () => {
        const wasOpen = !wrap.classList.contains("collapsed");
        wrap.classList.toggle("collapsed");
        label();
        if (wasOpen) wrap.scrollIntoView({ block: "nearest" });
      });
      wrap.append(ex);
    }
  }

  // The sidebar's section list follows the reader.
  const toc = [...document.querySelectorAll(".side .toc a[href^='#']")];
  const heads = toc.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
  if (heads.length) {
    let queued = false;
    const spy = () => {
      queued = false;
      let cur = 0;
      heads.forEach((h, k) => { if (h.getBoundingClientRect().top < 120) cur = k; });
      toc.forEach((a, k) => (k === cur ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")));
    };
    addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(spy); } }, { passive: true });
    spy();
  }

  // Docs pages: a reading-progress line at the top of the window.
  if (document.body.classList.contains("doc")) {
    const bar = document.createElement("div");
    bar.className = "progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.append(bar);
    let queued = false;
    const paint = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty("--read", max > 0 ? Math.min(1, scrollY / max) : 0);
    };
    addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
    paint();

    // A button back to the top, once the reader is well down the page.
    const top = document.createElement("button");
    top.type = "button";
    top.className = "to-top";
    top.setAttribute("aria-label", "Back to top");
    top.textContent = "\u2191";
    top.hidden = true;
    top.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
    document.body.append(top);
    addEventListener("scroll", () => { top.hidden = scrollY < 600; }, { passive: true });

    // [ and ] walk to the previous / next page (the pager).
    addEventListener("keydown", (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (ev.target.closest && ev.target.closest("input, textarea, select")) return;
      if (ev.key === "[") { document.querySelector(".pager .prev")?.click(); }
      else if (ev.key === "]") { document.querySelector(".pager .next")?.click(); }
    });
  }

  // A heading's # copies the link to that section.
  const toast = (text) => {
    const t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.textContent = text;
    document.body.append(t);
    setTimeout(() => t.remove(), 1400);
  };
  for (const a of document.querySelectorAll("article .anchor")) {
    a.addEventListener("click", async (ev) => {
      ev.preventDefault();
      history.replaceState(null, "", a.hash);
      try {
        await navigator.clipboard.writeText(location.href);
        toast("link copied ✓");
      } catch {
        toast("link in the address bar");
      }
    });
  }

  // The home page's terminal plays once it is in view, and again on ask.
  const term = document.querySelector(".term");
  if (term && "IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const again = term.querySelector(".term-again");
    const play = () => {
      term.classList.remove("play");
      void term.offsetWidth;
      term.classList.add("play");
      again.hidden = true;
      setTimeout(() => { again.hidden = false; }, 5200);
    };
    const seen = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { seen.disconnect(); play(); }
    });
    seen.observe(term);
    again.addEventListener("click", play);
  }

  // 404.html: name the missing path in the error.
  const lost = document.getElementById("lost-path");
  if (lost) lost.textContent = location.pathname;

  // Where a hit lives, by the first part of its url.
  const where = (u) =>
    u.startsWith("learn/") ? "learn" : u.startsWith("examples/") ? "example" : u.startsWith("std/") ? "api"
      : u.startsWith("spec/refs-standard-libraries/") ? "std spec" : u.startsWith("spec/") ? "spec" : "";

  // Docs: the version menu and, off the newest release, a banner.
  const vers = document.querySelector(".vers");
  const version = document.body.dataset.version;
  if (vers) {
    // Escape or a click elsewhere closes the menu.
    const sum = vers.querySelector("summary");
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && vers.open) { vers.open = false; sum.focus(); }
    });
    document.addEventListener("click", (ev) => { if (!vers.contains(ev.target)) vers.open = false; });
  }
  if (vers && version) {
    const base = new URL(root || "./", location.href);
    const here = location.href.slice(base.href.length).split("#")[0];
    const at = base.pathname.replace(/\/$/, "").split("/").pop();
    fetch(new URL("../versions.json", base)).then((r) => r.json()).then((v) => {
      const menu = vers.querySelector(".vers-menu");
      const item = (dir, label, note, cur) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = new URL("../" + dir + "/" + here, base).href;
        a.textContent = label;
        if (note) { const s = document.createElement("small"); s.textContent = note; a.append(s); }
        if (cur) a.setAttribute("aria-current", "true");
        li.append(a);
        menu.append(li);
      };
      for (const r of v.released) item(r, "v" + r, r === v.latest ? "latest" : "", at !== "latest" && at === r || at === "latest" && r === v.latest);
      item("dev", "dev", "main branch", at === "dev");
      if (at === "latest") {
        const s = vers.querySelector("summary");
        s.textContent = "latest";
        const full = document.createElement("span");
        full.className = "vers-full";
        full.textContent = ` (v${v.latest})`;
        s.append(full);
        s.setAttribute("aria-label", `Docs version: latest (v${v.latest})`);
      }
      if (version !== v.latest && v.latest) {
        const b = document.createElement("p");
        b.className = "ver-banner";
        b.append(version === "dev" ? "These are the docs of the unreleased main branch." : `These are the docs of rok ${version}.`);
        const a = document.createElement("a");
        a.href = new URL("../latest/" + here, base).href;
        a.textContent = `Latest release: v${v.latest} →`;
        b.append(a);
        document.querySelector(".top").after(b);
      }
    }).catch(() => {});
  }

  // `text` as nodes, each search term in it wrapped in <mark>.
  const marked = (text, terms) => {
    const words = terms.filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (!words.length) return [document.createTextNode(text)];
    const re = new RegExp(`(${words.join("|")})`, "gi");
    return text.split(re).map((part, k) => {
      if (k % 2 === 0) return document.createTextNode(part);
      const m = document.createElement("mark");
      m.textContent = part;
      return m;
    });
  };

  const load = () =>
    index ? Promise.resolve(index)
      : fetch(root + "search-index.json").then((r) => r.json()).then((d) => {
        index = d.p.map(([t, u]) => ({ t, u, p: "" }));
        for (const [k, t, id, named] of d.h) {
          const [pt, pu] = d.p[k];
          index.push({ t: named ? `${pt} › ${t}` : t, u: `${pu}#${id}`, p: pt });
        }
        return index;
      });

  const links = () => [...box.querySelectorAll("a")];

  const status = document.querySelector(".search [role=status]");

  const mark = (i) => {
    const as = links();
    as.forEach((a, k) => a.setAttribute("aria-selected", k === i ? "true" : "false"));
    sel = i;
    if (as[i]) {
      q.setAttribute("aria-activedescendant", as[i].id);
      as[i].scrollIntoView({ block: "nearest" });
    } else {
      q.removeAttribute("aria-activedescendant");
    }
  };

  const show = (on) => {
    box.hidden = !on;
    q.setAttribute("aria-expanded", on ? "true" : "false");
    if (!on) q.removeAttribute("aria-activedescendant");
  };

  const search = async () => {
    const query = q.value.trim().toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    if (!terms.length) { show(false); status.textContent = ""; return; }
    const data = await load();
    const hits = [];
    for (const e of data) {
      const t = e.t.toLowerCase();
      const hay = t + " " + e.p.toLowerCase();
      if (!terms.every((w) => hay.includes(w))) continue;
      hits.push([t.includes(query) ? (t.startsWith(query) ? 0 : 1) : 2, e.p ? 1 : 0, e]);
    }
    hits.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    box.replaceChildren();
    hits.slice(0, 40).forEach(([, , e], k) => {
      const li = document.createElement("li");
      li.setAttribute("role", "none");
      const a = document.createElement("a");
      a.id = "hit-" + k;
      a.setAttribute("role", "option");
      a.tabIndex = -1;
      a.href = root + e.u;
      const w = where(e.u);
      if (w) {
        const tag = document.createElement("span");
        tag.className = "src";
        tag.textContent = w;
        a.append(tag);
      }
      a.append(...marked(e.t, terms));
      if (e.p) {
        const s = document.createElement("small");
        s.textContent = e.p;
        a.append(s);
      }
      li.append(a);
      box.append(li);
    });
    if (!hits.length) {
      const li = document.createElement("li");
      li.setAttribute("role", "none");
      li.className = "empty";
      li.textContent = "No results";
      box.append(li);
    }
    show(true);
    status.textContent = !hits.length ? "No results" : hits.length > 40 ? `40 of ${hits.length} results shown` : hits.length === 1 ? "1 result" : `${hits.length} results`;
    mark(hits.length ? 0 : -1);
  };

  if (!q) return;
  q.addEventListener("focus", load, { once: true });
  q.addEventListener("input", search);
  q.addEventListener("keydown", (ev) => {
    const n = links().length;
    if (ev.key === "ArrowDown" && n) { ev.preventDefault(); mark((sel + 1) % n); }
    else if (ev.key === "ArrowUp" && n) { ev.preventDefault(); mark((sel - 1 + n) % n); }
    else if (ev.key === "Enter" && links()[sel]) { location.href = links()[sel].href; }
    else if (ev.key === "Escape") { show(false); q.blur(); }
  });
  // A shortcuts help card, opened with ? (and closed with Escape).
  let help = null;
  const buildHelp = () => {
    const rows = [["/", "Search the docs"]];
    if (document.querySelector(".pager")) rows.push(["[  ]", "Previous / next page"]);
    rows.push(["?", "This help"], ["Esc", "Close / clear search"]);
    help = document.createElement("div");
    help.className = "kbd-help";
    help.innerHTML =
      '<div class="kbd-card" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">' +
      "<h2>Keyboard shortcuts</h2><dl>" +
      rows.map(([k, d]) => `<dt>${k.trim().split(/\s+/).map((x) => `<kbd>${x}</kbd>`).join(" ")}</dt><dd>${d}</dd>`).join("") +
      "</dl></div>";
    help.addEventListener("click", (e) => { if (e.target === help) closeHelp(); });
    document.body.append(help);
  };
  const closeHelp = () => { if (help) { help.remove(); help = null; } };
  const toggleHelp = () => { if (help) closeHelp(); else buildHelp(); };

  document.addEventListener("keydown", (ev) => {
    const typing = ev.target.closest && ev.target.closest("input, textarea, select");
    if (ev.key === "/" && !typing) { ev.preventDefault(); q.focus(); }
    else if (ev.key === "?" && !typing) { ev.preventDefault(); toggleHelp(); }
    else if (ev.key === "Escape" && help) { closeHelp(); }
  });
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest(".search")) show(false);
  });
})();
