// Client-side search over search-index.json: [{t: title, u: url, p: page}].
(() => {
  const root = document.body.dataset.root || "";
  const q = document.getElementById("q");
  const box = document.getElementById("results");
  let index = null;
  let sel = -1;

  // The sidebar starts folded on small screens.
  const side = document.querySelector(".side details");
  if (side && matchMedia("(max-width: 860px)").matches) side.open = false;

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

  const load = () =>
    index ? Promise.resolve(index)
      : fetch(root + "search-index.json").then((r) => r.json()).then((d) => (index = d));

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
      a.textContent = e.t;
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

  q.addEventListener("focus", load, { once: true });
  q.addEventListener("input", search);
  q.addEventListener("keydown", (ev) => {
    const n = links().length;
    if (ev.key === "ArrowDown" && n) { ev.preventDefault(); mark((sel + 1) % n); }
    else if (ev.key === "ArrowUp" && n) { ev.preventDefault(); mark((sel - 1 + n) % n); }
    else if (ev.key === "Enter" && links()[sel]) { location.href = links()[sel].href; }
    else if (ev.key === "Escape") { show(false); q.blur(); }
  });
  document.addEventListener("keydown", (ev) => {
    const typing = ev.target.closest && ev.target.closest("input, textarea, select");
    if (ev.key === "/" && !typing) { ev.preventDefault(); q.focus(); }
  });
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest(".search")) show(false);
  });
})();
