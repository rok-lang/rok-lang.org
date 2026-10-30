// Client-side search over search-index.json: {p: [[title, url]], h:
// [[page, heading, id, named?]]}, read into [{t: title, u: url, p: page}].
// Page urls are canonical addresses within the version (`learn`,
// `learn/05-sum-types`); data-root is the version's root (`/latest/`).
(() => {
  const root = document.body.dataset.root || "/";
  const q = document.getElementById("q");
  const box = document.getElementById("results");
  let index = null;
  let sel = -1;
  // Interface strings; Korean pages get Korean ones.
  const ko = document.documentElement.lang === "ko";
  const T = ko
    ? { run: "실행", runLabel: "플레이그라운드에서 실행", copy: "복사", copyLabel: "코드 복사", copied: "복사됨", collapse: "접기", none: "결과 없음", down: "검색할 수 없습니다. 잠시 후 다시 시도하세요.", copiedLink: "링크 복사됨", linkInBar: "주소창에 링크가 있습니다", press: (k) => `${k}를 누르세요`, version: "문서 버전", found: (n, all) => (all > n ? `결과 ${all}개 중 ${n}개 표시` : `결과 ${n}개`),
        legend: [["↑ ↓", "이동"], ["↵", "열기"], ["esc", "닫기"]], missing: (v) => `${v}에는 그 페이지가 없어서 가장 가까운 페이지를 열었습니다.`,
        help: "키보드 단축키", rows: { search: "문서 검색", pager: "이전 / 다음 페이지", filter: "메서드 거르기", help: "이 도움말", esc: "닫기 / 검색 지우기" },
        filter: "메서드 거르기", shown: (n) => `메서드 ${n}개`, here: "(지금 쓰는 시스템)" }
    : { run: "Run", runLabel: "Run in the playground", copy: "Copy", copyLabel: "Copy code", copied: "Copied", collapse: "Collapse", none: "No results", down: "Search is unavailable right now.", copiedLink: "Link copied", linkInBar: "link in the address bar", press: (k) => `Press ${k}`, version: "Docs version", found: (n, all) => (all > n ? `${n} of ${all} results shown` : n === 1 ? "1 result" : `${n} results`),
        legend: [["↑ ↓", "to move"], ["↵", "to open"], ["esc", "to close"]], missing: (v) => `That page is not in ${v}, so this is the closest one.`,
        help: "Keyboard shortcuts", rows: { search: "Search the docs", pager: "Previous / next page", filter: "Filter methods", help: "This help", esc: "Close / clear search" },
        filter: "Filter methods", shown: (n) => (n === 1 ? "1 method" : `${n} methods`), here: "(your system)" };

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

  // Buttons with data-copy are copy.js's.

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

  // Run needs deflate-raw, which Chrome 80-102 lacks though it has
  // CompressionStream.
  const deflate = (() => { try { new CompressionStream("deflate-raw"); return true; } catch { return false; } })();
  const packed = async (src) => {
    const s = new Blob([src]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    const b = new Uint8Array(await new Response(s).arrayBuffer());
    let bin = "";
    for (const c of b) bin += String.fromCharCode(c);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  // Code blocks come with their bar (layout.rok); add run and copy.
  for (const wrap of document.querySelectorAll("article .code.cb")) {
    const head = wrap.querySelector(".cb-h");
    const pre = wrap.querySelector(".cb-body > pre");
    if (!head || !pre) continue;
    const lang = (pre.querySelector("code")?.className.match(/language-(\w+)/) || [])[1] || "";
    const play = document.body.dataset.play;
    const b = document.createElement("button");
    // Run is a link with its address ready before the click: Safari
    // blocks a window opened after an await.
    if (play && lang === "rok" && deflate && runnableRok(pre.innerText)) {
      packed(pre.innerText).then((code) => {
        const t = document.createElement("a");
        t.className = "btn-2 btn-sm run";
        t.href = `${play}/#code=${code}`;
        t.target = "_blank";
        t.rel = "noopener";
        t.textContent = T.run;
        t.setAttribute("aria-label", T.runLabel);
        b.before(t);
      }, () => {});
    }
    b.type = "button";
    b.className = "btn-2 btn-sm copy code-copy";
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

  // 404.html: name the missing path.
  const lost = document.getElementById("lost-path");
  if (lost) lost.textContent = location.pathname;

  // Where a hit lives, by the first part of its url: the section's one
  // name, as in the header.
  const under = (u, d) => u === d || u.startsWith(d + "/") || u.startsWith(d + "#");
  const SEC = ko
    ? [["learn", "가이드"], ["examples", "예제"], ["errors", "에러 코드"], ["spec/refs-lang/009-tools", "도구"], ["spec/refs-standard-libraries", "라이브러리 명세"], ["spec", "언어 명세"], ["std", "표준 라이브러리"]]
    : [["learn", "Guide"], ["examples", "Examples"], ["errors", "Error codes"], ["spec/refs-lang/009-tools", "Tools"], ["spec/refs-standard-libraries", "Library spec"], ["spec", "Language spec"], ["std", "Std library"]];
  const where = (u) => {
    const v = u.replace(/^ko\//, "");
    for (const [d, name] of SEC) if (under(v, d)) return name;
    return "";
  };
  // The section index of a page path (after the version directory).
  const sectionOf = (path) => {
    const lang = path.startsWith("ko/") ? "ko/" : "";
    const v = path.slice(lang.length);
    for (const [d] of SEC) if (under(v, d)) return lang + d;
    return lang.replace(/\/$/, "");
  };
  const KIND = ko
    ? { method: "메서드", fn: "함수", struct: "구조체", enum: "열거형", trait: "트레이트", type: "타입 별칭", const: "상수", static: "정적", impl: "impl" }
    : { method: "method", fn: "fn", struct: "struct", enum: "enum", trait: "trait", type: "type", const: "const", static: "static", impl: "impl" };

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
    // This page in another version: the same path after the version
    // directory (which may be the /0.1 alias of /0.1.2).
    const here = location.pathname.split("/").slice(2).join("/");
    const at = root.replace(/\/$/, "").split("/").pop();
    fetch("/versions.json").then((r) => r.json()).then((v) => {
      const menu = vers.querySelector(".vers-menu");
      const item = (dir, label, note, cur) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "/" + dir + (here ? "/" + here : "");
        // A page that version lacks: its section's start, with a note.
        if (!cur && here) {
          a.addEventListener("click", (ev) => {
            ev.preventDefault();
            fetch(a.href, { method: "HEAD" }).then((r) => {
              if (r.ok) { location.href = a.href; return; }
              try { sessionStorage.setItem("rok-missing", label); } catch {}
              // The section's start, or the docs home if that version
              // has no such section either.
              const s = sectionOf(here);
              const to = "/" + dir + (s ? "/" + s : "");
              const home = "/" + dir + (here.startsWith("ko/") ? "/ko" : "");
              if (to === home) { location.href = home; return; }
              fetch(to, { method: "HEAD" }).then((r2) => { location.href = r2.ok ? to : home; }, () => { location.href = home; });
            }, () => { location.href = a.href; });
          });
        }
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

  // Arrived from the version menu at a section start instead of a page.
  try {
    const v = sessionStorage.getItem("rok-missing");
    if (v) {
      sessionStorage.removeItem("rok-missing");
      const art = document.querySelector("article.prose");
      if (art) {
        const p = document.createElement("p");
        p.className = "tr-note";
        p.setAttribute("role", "status");
        p.textContent = T.missing(v);
        art.prepend(p);
      }
    }
  } catch {}

  // API pages: `f` filters the methods, on the page and in the rail.
  const items = [...document.querySelectorAll("article .api-item")];
  if (items.some((it) => it.querySelector(".members > li"))) {
    const box = document.createElement("div");
    box.className = "api-filter";
    box.innerHTML = `<input type="search" placeholder="${T.filter}" aria-label="${T.filter}" aria-keyshortcuts="f" autocomplete="off"><kbd class="kbd" aria-hidden="true">f</kbd><span class="ct" role="status"></span>`;
    const first = document.querySelector("article.prose > h2, article.prose > .api-item");
    first.before(box);
    const fi = box.querySelector("input");
    const ct = box.querySelector(".ct");
    const rail = [...document.querySelectorAll(".toc li.m, .toc-m li.m")];
    const apply = () => {
      const v = fi.value.trim().toLowerCase();
      let n = 0;
      for (const it of items) {
        const name = (it.id.split(".").pop() || "").toLowerCase();
        const whole = v && name.includes(v);
        let any = false;
        for (const li of it.querySelectorAll(".members > li")) {
          const m = (li.id.split(".").pop() || "").toLowerCase();
          const on = !v || whole || m.includes(v);
          li.hidden = !on;
          if (on) { any = true; n++; }
        }
        it.hidden = !!v && !any && !whole;
      }
      for (const li of rail) {
        const a = li.querySelector("a");
        li.hidden = !!v && !a.textContent.toLowerCase().includes(v);
      }
      ct.textContent = v ? T.shown(n) : "";
    };
    fi.addEventListener("input", apply);
    fi.addEventListener("keydown", (ev) => { if (ev.key === "Escape") { fi.value = ""; apply(); fi.blur(); } });
    addEventListener("keydown", (ev) => {
      if (ev.key !== "f" || ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (ev.target.closest && ev.target.closest("input, textarea, select, [contenteditable]")) return;
      ev.preventDefault();
      fi.focus();
      fi.select();
    });
  }

  // The download page and the landing page's archives: the row for the
  // visitor's system is marked once known (a tint, so nothing moves).
  const rows = document.querySelectorAll("[data-os]");
  if (rows.length) {
    const ua = navigator.userAgent;
    const plat = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    const os = /Android|iPhone|iPad/.test(ua) ? "" : /mac/i.test(plat) ? "macos" : /win/i.test(plat) ? "windows" : /linux/i.test(plat) ? "linux" : "";
    const arm = /aarch64|arm/i.test(plat + " " + ua);
    for (const r of rows) {
      if (r.dataset.os !== os) continue;
      // Linux: the glibc archive of the machine's architecture.
      if (os === "linux" && (r.dataset.libc !== "gnu" || (r.dataset.arch === "aarch64") !== arm)) continue;
      r.classList.add("here");
      const s = document.createElement("span");
      s.className = "sr-only";
      s.textContent = " " + T.here;
      (r.querySelector("h3, th") || r).append(s);
    }
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
      : fetch(root + (ko ? "ko/" : "") + "search-index.json").then((r) => {
        if (!r.ok) throw new Error(`search-index.json: ${r.status}`);
        return r.json();
      }).then((d) => {
        index = d.p.map(([t, u, x]) => ({ t, u, p: "", k: "", x: x || "" }));
        for (const [n, t, id, named, kind, x] of d.h) {
          const [pt, pu] = d.p[n];
          index.push({ t: named ? `${pt} › ${t}` : t, u: `${pu}#${id}`, p: pt, k: kind || "", x: x || "" });
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

  // Ranking: an API name equal to the query, then one starting with it,
  // then a page title or heading, then the excerpts. Below four
  // characters only names, titles and headings that start (or have a
  // word that starts) with the query count, so "fn" finds no "define".
  const KIND_ORDER = { struct: 0, enum: 0, trait: 0, type: 1, fn: 2, const: 3, static: 3, impl: 4, method: 5 };
  const MAIN_TYPES = ["list", "str", "strbuf", "dict", "set"];
  const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const score = (e, query, terms, short) => {
    const t = e.t.toLowerCase();
    if (e.k) {
      const name = t.split("::").pop();
      if (name === query || t === query) return 0;
      if (name.startsWith(query) || t.startsWith(query)) return 1;
    }
    const word = new RegExp("(^|[^\\p{L}\\p{N}_])" + esc(query), "u");
    if (t.startsWith(query)) return 2;
    if (word.test(t)) return 2.2;
    if (short) return -1;
    if (terms.every((w) => t.includes(w))) return 2.5;
    const hay = t + " " + (e.x + " " + e.p).toLowerCase();
    if (terms.every((w) => hay.includes(w))) return 4;
    return -1;
  };

  const search = async () => {
    const query = q.value.trim().toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    if (!terms.length) { show(false); status.textContent = ""; return; }
    let data;
    try {
      data = await load();
    } catch {
      // Offline, or the index is missing mid-deploy: say so in the list.
      const li = document.createElement("li");
      li.setAttribute("role", "none");
      li.className = "empty";
      li.textContent = T.down;
      box.replaceChildren(li);
      show(true);
      status.textContent = T.down;
      mark(-1);
      return;
    }
    const short = query.length < 4;
    const hits = [];
    for (const e of data) {
      const s = score(e, query, terms, short);
      if (s < 0) continue;
      const owner = e.k === "method" ? e.t.toLowerCase().split("::")[0] : "";
      hits.push([s, e.k ? (KIND_ORDER[e.k] ?? 6) : (e.p ? 7 : 6), MAIN_TYPES.includes(owner) ? 0 : 1, e.t.length, e]);
    }
    hits.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3]);
    box.replaceChildren();
    hits.slice(0, 40).forEach((h, k) => {
      const e = h[4];
      const li = document.createElement("li");
      li.setAttribute("role", "none");
      const a = document.createElement("a");
      a.id = "hit-" + k;
      a.setAttribute("role", "option");
      a.tabIndex = -1;
      a.href = root + e.u;
      const tag = document.createElement("span");
      tag.className = "src";
      tag.textContent = e.k ? KIND[e.k] || e.k : where(e.u);
      a.append(tag);
      const title = document.createElement("span");
      title.className = "hit-t";
      title.append(...marked(e.t, terms));
      a.append(title);
      if (e.p) {
        const s = document.createElement("small");
        s.className = "hit-p";
        s.textContent = e.p;
        a.append(s);
      }
      if (e.x) {
        const s = document.createElement("small");
        s.className = "hit-x";
        s.textContent = e.x;
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
    const legend = document.createElement("li");
    legend.setAttribute("role", "none");
    legend.setAttribute("aria-hidden", "true");
    legend.className = "legend";
    for (const [k, what] of T.legend) {
      const span = document.createElement("span");
      for (const key of k.split(" ")) { const b = document.createElement("kbd"); b.className = "kbd"; b.textContent = key; span.append(b); }
      span.append(" " + what);
      legend.append(span);
    }
    box.append(legend);
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
  q.addEventListener("focus", () => load().catch(() => {}), { once: true });
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
    const rows = [["/", T.rows.search]];
    if (document.querySelector(".pager")) rows.push(["[  ]", T.rows.pager]);
    if (document.querySelector(".api-filter")) rows.push(["f", T.rows.filter]);
    rows.push(["?", T.rows.help], ["Esc", T.rows.esc]);
    help = document.createElement("div");
    help.className = "kbd-help";
    help.innerHTML =
      `<div class="kbd-card" role="dialog" aria-modal="true" aria-label="${T.help}">` +
      `<h2>${T.help}</h2><dl>` +
      rows.map(([k, d]) => `<dt>${k.trim().split(/\s+/).map((x) => `<kbd>${x}</kbd>`).join(" ")}</dt><dd>${d}</dd>`).join("") +
      "</dl></div>";
    help.addEventListener("click", (e) => { if (e.target === help) closeHelp(); });
    document.body.append(help);
  };
  const closeHelp = () => { if (help) { help.remove(); help = null; } };
  const toggleHelp = () => { if (help) closeHelp(); else buildHelp(); };

  document.addEventListener("keydown", (ev) => {
    const typing = ev.target.closest && ev.target.closest("input, textarea, select");
    // `/`, Ctrl+K and Cmd+K are keys.js's.
    if (ev.key === "?" && !typing) { ev.preventDefault(); toggleHelp(); }
    else if (ev.key === "Escape" && help) { closeHelp(); }
  });
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest(".search")) show(false);
  });
  // `?q=` (the 404 page's search field): open the search with it.
  const pre = new URLSearchParams(location.search).get("q");
  if (pre) {
    q.value = pre;
    sbox.classList.add("open");
    q.focus();
    search();
  }
})();
