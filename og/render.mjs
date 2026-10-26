// Render an OG card HTML to a 1200x630 PNG with headless Chrome.
// usage: node render.mjs <input.html> <output.png>
import puppeteer from "puppeteer-core";
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

const [input, output] = process.argv.slice(2);
if (!input || !output) { console.error("usage: node render.mjs <input.html> <output.png>"); process.exit(2); }

function chrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const guesses = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
  ];
  for (const g of guesses) if (existsSync(g)) return g;
  throw new Error("no Chrome found; set CHROME_PATH");
}

const browser = await puppeteer.launch({
  executablePath: chrome(),
  headless: true,
  args: ["--no-sandbox", "--force-color-profile=srgb", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(input).href, { waitUntil: "networkidle0" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.screenshot({ path: output, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log("wrote", output);
