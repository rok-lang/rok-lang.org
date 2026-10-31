// A docs page's link preview card, 1200x630 at 72 ppi. serve renders it
// on request (serve.rok og_card) with --input section, title, lead, lang;
// logo.svg sits beside it. Colours are web/css/rok.css's dark theme.
#let bg = rgb("#090a0d")
#let ink = rgb("#edeef2")
#let ink2 = rgb("#a8aab3")
#let line2 = rgb("#313338")
#let input(k) = sys.inputs.at(k, default: "")
#let ko = input("lang") == "ko"

#set page(width: 1200pt, height: 630pt, margin: (x: 72pt, y: 64pt), fill: bg)
#set text(font: ("Geist", "Pretendard"), fill: ink, lang: if ko { "ko" } else { "en" }, hyphenate: false, top-edge: 0.8em, bottom-edge: -0.2em)

// `body` in lines of `pitch`, at most `n` of them (the rest is cut)
#let lines(size, pitch, n, body) = context {
  let p = par(leading: pitch - size, body)
  let most = n * pitch - (pitch - size)
  let h = measure(block(width: 1056pt, p)).height
  block(width: 1056pt, height: calc.min(h, most), clip: true, p)
}

#grid(
  rows: (auto, 1fr, auto, auto),
  grid(
    columns: (auto, auto, auto, auto),
    column-gutter: 16pt,
    align: horizon,
    image("logo.svg", width: 48pt),
    text(size: 30pt, weight: "semibold", tracking: -0.018em)[Rok],
    text(size: 30pt, fill: line2)[/],
    text(size: 30pt, weight: "medium", fill: ink2, tracking: -0.018em, input("section")),
  ),
  [],
  {
    let pitch = if ko { 80pt } else { 72pt }
    lines(64pt, pitch, 3, text(size: 64pt, weight: "semibold", tracking: if ko { -0.02em } else { -0.032em }, input("title")))
  },
  if input("lead") != "" {
    let pitch = if ko { 46pt } else { 40pt }
    pad(top: 24pt, lines(28pt, pitch, 3, text(size: 28pt, fill: ink2, input("lead"))))
  },
)
