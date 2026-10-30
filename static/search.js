// Client-side search over search-index.json: {p: [[title, url]], h:
// [[page, heading, id, named?]]}, read into [{t: title, u: url, p: page}].
(() => {
  const root = document.body.dataset.root || "";
  const q = document.getElementById("q");
  const box = document.getElementById("results");
  let index = null;
  let sel = -1;
  // Interface strings; the Korean spec pages get Korean ones.
  const T = document.documentElement.lang === "ko"
    ? { run: "실행", runLabel: "플레이그라운드에서 실행", copy: "복사", copyLabel: "코드 복사", copied: "복사됨", collapse: "접기", none: "결과 없음", copiedLink: "링크 복사됨 ✓", linkInBar: "주소창에 링크가 있습니다", press: (k) => `${k}를 누르세요`, version: "문서 버전", found: (n, all) => (all > n ? `결과 ${all}개 중 ${n}개 표시` : `결과 ${n}개`) }
    : { run: "Run", runLabel: "Run in the playground", copy: "Copy", copyLabel: "Copy code", copied: "Copied", collapse: "Collapse", none: "No results", copiedLink: "link copied ✓", linkInBar: "link in the address bar", press: (k) => `Press ${k}`, version: "Docs version", found: (n, all) => (all > n ? `${n} of ${all} results shown` : n === 1 ? "1 result" : `${n} results`) };

  // On wide screens the sidebar scrolls to the current page (the API
  // list is long).
  const aside = document.querySelector(".side");
  const hereItem = aside && aside.querySelector("[aria-current=page]");
  const centre = () => {
    if (hereItem && aside.scrollHeight > aside.clientHeight) {
      aside.scrollTop = hereItem.offsetTop - aside.clientHeight / 2;
    }
  };
  centre();

  // A modal panel keeps Tab among `els()`, with the rest of the page inert
  // and not scrolling.
  let heldAt = 0;
  const hold = (on) => {
    if (on) heldAt = scrollY;
    document.documentElement.classList.toggle("lock", on);
    for (const el of document.querySelectorAll("body > :is(.skip, .ver-banner, main, .foot), .shell > main")) el.inert = on;
    if (!on) scrollTo(scrollX, heldAt);
  };
  // Focus moves by hand: the header's sticky panel would otherwise
  // scroll the locked page to each link.
  const trap = (ev, els) => {
    if (ev.key !== "Tab" || !els.length) return;
    ev.preventDefault();
    const i = els.indexOf(document.activeElement);
    const n = els.length;
    const next = i < 0 ? (ev.shiftKey ? n - 1 : 0) : (i + (ev.shiftKey ? n - 1 : 1)) % n;
    els[next].focus({ preventScroll: true });
  };
  const narrow = matchMedia("(max-width: 900px)");

  // Narrow screens: the sidebar is a drawer, opened from the header.
  const sideBtn = document.querySelector(".side-toggle");
  if (aside && sideBtn) {
    const scrim = document.createElement("div");
    scrim.className = "scrim";
    scrim.hidden = true;
    document.body.append(scrim);
    const header = document.querySelector(".hdr");
    const isOpen = () => document.body.classList.contains("side-open");
    const setSide = (open, back) => {
      if (open === isOpen()) return;
      document.body.classList.toggle("side-open", open);
      sideBtn.setAttribute("aria-expanded", open ? "true" : "false");
      scrim.hidden = !open;
      hold(open);
      if (header) header.inert = open;
      if (open) {
        centre();
        (hereItem || aside.querySelector("a, button")).focus({ preventScroll: true });
      } else if (back) {
        sideBtn.focus({ preventScroll: true });
      }
    };
    sideBtn.addEventListener("click", () => setSide(true));
    aside.querySelector(".side-close")?.addEventListener("click", () => setSide(false, true));
    scrim.addEventListener("click", () => setSide(false, true));
    aside.addEventListener("click", (e) => { if (e.target.closest("a")) setSide(false); });
    aside.addEventListener("keydown", (e) => {
      if (!isOpen()) return;
      if (e.key === "Escape") setSide(false, true);
      else trap(e, [...aside.querySelectorAll("a[href], button")]);
    });
    narrow.addEventListener("change", () => setSide(false));
  }

  // "On this page" under the title folds again once a section is chosen.
  const tocM = document.querySelector(".toc-m");
  if (tocM) tocM.addEventListener("click", (e) => { if (e.target.closest("a")) tocM.open = false; });

  // Theme: "light" or "dark" from the `theme` cookie, which every
  // *.rok-lang.org site shares, else localStorage, else the system
  // setting. The inline script in <head> sets the class before the first
  // paint.
  const html = document.documentElement;
  const media = matchMedia("(prefers-color-scheme: dark)");
  const stored = () => {
    const m = document.cookie.match(/(?:^|; )theme=(light|dark)(?:;|$)/);
    if (m) return m[1];
    try { const t = localStorage.getItem("theme"); return t === "light" || t === "dark" ? t : "auto"; } catch { return "auto"; }
  };
  const ko = html.lang === "ko";
  const apply = () => {
    const t = stored();
    const dark = t === "dark" || (t === "auto" && media.matches);
    html.classList.toggle("dk", dark);
    html.classList.toggle("lt", !dark);
    for (const b of document.querySelectorAll("[data-theme-set]")) b.setAttribute("aria-pressed", b.dataset.themeSet === t ? "true" : "false");
    for (const b of document.querySelectorAll(".ib.theme")) {
      b.setAttribute("aria-pressed", dark ? "true" : "false");
      b.title = ko ? (dark ? "라이트 테마로 바꾸기" : "다크 테마로 바꾸기") : (dark ? "Switch to light theme" : "Switch to dark theme");
    }
  };
  const setTheme = (t) => {
    try { t === "auto" ? localStorage.removeItem("theme") : localStorage.setItem("theme", t); } catch {}
    const where = (/(^|\.)rok-lang\.org$/.test(location.hostname) ? "; Domain=.rok-lang.org" : "") + "; Path=/; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : "");
    document.cookie = t === "auto" ? `theme=${where}; Max-Age=0` : `theme=${t}${where}; Max-Age=31536000`;
    apply();
  };
  apply();
  media.addEventListener("change", apply);
  // Back from another rok-lang.org site, maybe with another theme.
  addEventListener("pageshow", apply);
  for (const b of document.querySelectorAll("[data-theme-set]")) b.addEventListener("click", () => setTheme(b.dataset.themeSet));
  for (const b of document.querySelectorAll(".ib.theme")) b.addEventListener("click", () => setTheme(html.classList.contains("dk") ? "light" : "dark"));

  // Copy buttons with their text in data-copy.
  for (const b of document.querySelectorAll("[data-copy]")) {
    const label = b.textContent;
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "Copied"; } catch { b.textContent = "Press Ctrl+C"; }
      setTimeout(() => { b.textContent = label; }, 1600);
    });
  }

  // Compact header: the hamburger opens the nav as a drop panel. It
  // closes on a link, an outside click, Escape, or a return to the full nav.
  const top = document.querySelector(".top");
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("nav");
  if (top && navToggle && nav) {
    const setNav = (open) => {
      if (open === top.classList.contains("nav-open")) return;
      top.classList.toggle("nav-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      hold(open);
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
      if (!top.classList.contains("nav-open")) return;
      if (e.key === "Escape") { setNav(false); navToggle.focus({ preventScroll: true }); }
      else trap(e, [navToggle, ...nav.querySelectorAll("a")]);
    });
    // Collapse exactly when the full nav would not fit on one row: measure
    // the natural width with the row forced not to wrap or shrink. Works
    // for any number of links, so there is no per-page width breakpoint.
    const fitNav = () => {
      top.classList.remove("nav-compact");
      top.classList.add("nav-measuring");
      const row = top.querySelector(".in") || top;
      const overflow = row.scrollWidth > row.clientWidth + 1;
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

  // Only the newest release has data-play: the playground runs it.
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

  // Code blocks come with their bar (layout.rok); add run and copy.
  for (const wrap of document.querySelectorAll("article .code.cb")) {
    const head = wrap.querySelector(".cb-h");
    const pre = wrap.querySelector(".cb-body > pre");
    if (!head || !pre) continue;
    const lang = (pre.querySelector("code")?.className.match(/language-(\w+)/) || [])[1] || "";
    const play = document.body.dataset.play;
    if (play && lang === "rok" && runnableRok(pre.innerText) && "CompressionStream" in window) {
      const t = document.createElement("button");
      t.type = "button";
      t.className = "btn btn-sm run";
      t.textContent = T.run;
      t.setAttribute("aria-label", T.runLabel);
      t.addEventListener("click", async () => {
        const s = new Blob([pre.innerText]).stream().pipeThrough(new CompressionStream("deflate-raw"));
        const b = new Uint8Array(await new Response(s).arrayBuffer());
        const code = btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        window.open(`${play}/#code=${code}`, "_blank", "noopener");
      });
      head.append(t);
    }
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn-2 btn-sm copy";
    b.textContent = T.copy;
    b.setAttribute("aria-label", T.copyLabel);
    b.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText.replace(/\n$/, ""));
        b.textContent = T.copied;
      } catch {
        b.textContent = T.press(/Mac|iPhone|iPad/.test(navigator.platform) ? "\u2318C" : "Ctrl+C");
      }
      b.classList.add("done");
      setTimeout(() => { b.textContent = T.copy; b.classList.remove("done"); }, 1600);
    });
    head.append(b);
    const ex = wrap.querySelector(".expand");
    if (ex) {
      const more = ex.textContent;
      ex.addEventListener("click", () => {
        const open = wrap.classList.toggle("collapsed") === false;
        ex.textContent = open ? T.collapse : more;
        ex.setAttribute("aria-expanded", open ? "true" : "false");
        if (!open) wrap.scrollIntoView({ block: "nearest" });
      });
    }
  }

  // The sidebar's section list follows the reader.
  const toc = [...document.querySelectorAll(".toc a[href^='#']")];
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

  if (document.querySelector(".pager")) {
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
        toast(T.copiedLink);
      } catch {
        toast(T.linkInBar);
      }
    });
  }

  // 404.html: name the missing path in the error.
  const lost = document.getElementById("lost-path");
  if (lost) lost.textContent = location.pathname;

  // Where a hit lives, by the first part of its url.
  const where = (u) =>
    u.startsWith("learn/") ? "Learn" : u.startsWith("examples/") ? "Example" : u.startsWith("std/") ? "API"
      : u.startsWith("spec/refs-standard-libraries/") ? "Library spec" : u.startsWith("spec/") ? "Spec" : "";

  // Docs: the version menu and, off the newest release, a banner.
  const vers = document.querySelector(".vers");
  const version = document.body.dataset.version;
  if (vers) {
    // Escape or a click elsewhere closes the menu.
    const sum = vers.querySelector("summary");
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && vers.open) { vers.open = false; sum.focus({ preventScroll: true }); }
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
      // "v0.1", noted with the patch release its docs follow: "0.1.2 · latest".
      const note = (r) => [v.patches && v.patches[r], r === v.latest && "latest"].filter(Boolean).join(" · ");
      for (const r of v.released) item(r, "v" + r, note(r), at !== "latest" && at === r || at === "latest" && r === v.latest);
      item("dev", "dev", "main branch", at === "dev");
      if (at === "latest") {
        const s = vers.querySelector("summary");
        s.textContent = "latest";
        const tail = document.createElement("span");
        tail.className = "vers-full";
        const latest = (v.patches && v.patches[v.latest]) || v.latest;
        tail.textContent = ` (v${latest})`;
        s.append(tail);
        s.setAttribute("aria-label", `${T.version}: latest (v${latest})`);
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
      // The pages' own addresses, without .html.
      a.href = root + e.u.replace(/(^|\/)index\.html(?=#|$)/, "$1").replace(/\.html(?=#|$)/, "");
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
      li.textContent = T.none;
      box.append(li);
    }
    show(true);
    status.textContent = !hits.length ? T.none : T.found(Math.min(hits.length, 40), hits.length);
    mark(hits.length ? 0 : -1);
  };

  if (!q) return;
  // Folded header: the search icon opens the field.
  const sbox = q.closest(".search");
  sbox.addEventListener("click", () => {
    if (top && top.classList.contains("nav-compact")) { sbox.classList.add("open"); q.focus(); }
  });
  q.addEventListener("blur", () => { if (!q.value) setTimeout(() => sbox.classList.remove("open"), 150); });
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
    if ((ev.key === "/" && !typing) || (ev.key === "k" && (ev.metaKey || ev.ctrlKey))) { ev.preventDefault(); sbox.click(); q.focus(); }
    else if (ev.key === "?" && !typing) { ev.preventDefault(); toggleHelp(); }
    else if (ev.key === "Escape" && help) { closeHelp(); }
  });
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest(".search")) show(false);
  });
})();
