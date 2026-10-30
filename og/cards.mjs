// Render the docs' link preview cards (1200x630 PNG) from the manifest a
// build writes (public/og-cards.json): each section index and guide
// chapter in both languages, with its section, title and first sentence.
// usage: node cards.mjs ../public/og-cards.json ../static/og
// The manifest is copied to <out>/cards.json, so a build can tell when
// the cards no longer match the pages.
import puppeteer from "puppeteer-core";
import { pathToFileURL, fileURLToPath } from "node:url";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";

const [manifest, out] = process.argv.slice(2);
if (!manifest || !out) { console.error("usage: node cards.mjs <og-cards.json> <out dir>"); process.exit(2); }
const cards = JSON.parse(readFileSync(manifest, "utf8"));
mkdirSync(out, { recursive: true });

function chrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  for (const g of ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/snap/bin/chromium"]) if (existsSync(g)) return g;
  throw new Error("no Chrome found; set CHROME_PATH");
}

const browser = await puppeteer.launch({ executablePath: chrome(), headless: true, args: ["--no-sandbox", "--force-color-profile=srgb", "--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
const tpl = join(dirname(fileURLToPath(import.meta.url)), "docs-card.html");
await page.goto(pathToFileURL(tpl).href, { waitUntil: "networkidle0" });
const keep = new Set(["cards.json"]);
for (const c of cards) {
  await page.evaluate((c) => {
    document.documentElement.lang = c.lang;
    document.getElementById("sec").textContent = c.section;
    document.getElementById("title").textContent = c.title;
    document.getElementById("lead").textContent = c.sentence;
  }, c);
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.screenshot({ path: join(out, c.file), clip: { x: 0, y: 0, width: 1200, height: 630 } });
  keep.add(c.file);
}
await browser.close();
// Cards of pages that are gone.
for (const f of readdirSync(out)) if (!keep.has(f)) unlinkSync(join(out, f));
writeFileSync(join(out, "cards.json"), readFileSync(manifest));
console.log(`wrote ${cards.length} cards to ${out}`);
