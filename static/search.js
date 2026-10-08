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

  const load = () =>
    index ? Promise.resolve(index)
      : fetch(root + "search-index.json").then((r) => r.json()).then((d) => (index = d));

  const links = () => [...box.querySelectorAll("a")];

  const mark = (i) => {
    const as = links();
    as.forEach((a, k) => a.classList.toggle("sel", k === i));
    sel = i;
    if (as[i]) as[i].scrollIntoView({ block: "nearest" });
  };

  const search = async () => {
    const query = q.value.trim().toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    if (!terms.length) { box.hidden = true; return; }
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
    for (const [, , e] of hits.slice(0, 40)) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = root + e.u;
      a.textContent = e.t;
      if (e.p) {
        const s = document.createElement("small");
        s.textContent = e.p;
        a.append(s);
      }
      li.append(a);
      box.append(li);
    }
    if (!hits.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "결과 없음";
      box.append(li);
    }
    box.hidden = false;
    mark(hits.length ? 0 : -1);
  };

  q.addEventListener("focus", load, { once: true });
  q.addEventListener("input", search);
  q.addEventListener("keydown", (ev) => {
    const n = links().length;
    if (ev.key === "ArrowDown" && n) { ev.preventDefault(); mark((sel + 1) % n); }
    else if (ev.key === "ArrowUp" && n) { ev.preventDefault(); mark((sel - 1 + n) % n); }
    else if (ev.key === "Enter" && links()[sel]) { location.href = links()[sel].href; }
    else if (ev.key === "Escape") { box.hidden = true; q.blur(); }
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "/" && document.activeElement !== q) { ev.preventDefault(); q.focus(); }
  });
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest(".search")) box.hidden = true;
  });
})();
