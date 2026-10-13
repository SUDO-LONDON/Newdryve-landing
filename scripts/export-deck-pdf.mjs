#!/usr/bin/env node
/**
 * Export the pitch deck (public/thedeck-assets/Newdryve Pitch.dc.html) to a
 * single PDF, one 1920×1080 page per slide, at
 * public/thedeck-assets/Newdryve-Pitch-Deck.pdf. The "Download PDF" button on
 * /thedeck serves that file, so re-run this after every deck edit.
 *
 *   npm install --no-save playwright-core
 *   node scripts/export-deck-pdf.mjs
 *
 * It drives an installed Chrome by default. Set DECK_PDF_CHROMIUM to a
 * Chromium/Chrome executable to use a different one.
 *
 * The deck loads React from unpkg and its fonts from Google Fonts. Where those
 * hosts are unreachable (a sandbox or CI with a locked-down network), set
 * DECK_PDF_OFFLINE_MODULES to a node_modules directory containing
 * react@18.3.1, react-dom@18.3.1, @babel/standalone@7.29.0,
 * @fontsource/instrument-serif and @fontsource/hanken-grotesk, and they are
 * served from there instead.
 */

import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = path.join(root, "public", "thedeck-assets");
const deckFile = "Newdryve Pitch.dc.html";
const outFile = path.join(assetsDir, "Newdryve-Pitch-Deck.pdf");

let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  console.error("playwright-core is not installed. Run: npm install --no-save playwright-core");
  process.exit(1);
}

const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css" };
const server = createServer(async (req, res) => {
  const name = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "");
  const file = path.join(assetsDir, name);
  if (!file.startsWith(assetsDir + path.sep)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch(
  process.env.DECK_PDF_CHROMIUM
    ? { executablePath: process.env.DECK_PDF_CHROMIUM, args: ["--headless=new"] }
    : { channel: "chrome", args: ["--headless=new"] },
);

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  const offline = process.env.DECK_PDF_OFFLINE_MODULES;
  if (offline) {
    const unpkg = {
      "/react@18.3.1/umd/react.production.min.js": "react/umd/react.production.min.js",
      "/react-dom@18.3.1/umd/react-dom.production.min.js": "react-dom/umd/react-dom.production.min.js",
      "/@babel/standalone@7.29.0/babel.min.js": "@babel/standalone/babel.min.js",
    };
    await page.route("https://unpkg.com/**", async (route) => {
      const local = unpkg[new URL(route.request().url()).pathname];
      if (!local) return route.abort();
      await route.fulfill({ contentType: "text/javascript", body: await readFile(path.join(offline, local)) });
    });
    // Same faces and weights the deck asks Google Fonts for, latin subset.
    const faces = [
      ...[400, 500, 600, 700, 800].map((w) => ["Hanken Grotesk", "hanken-grotesk", w, "normal"]),
      ["Instrument Serif", "instrument-serif", 400, "normal"],
      ["Instrument Serif", "instrument-serif", 400, "italic"],
    ];
    await page.route("https://fonts.googleapis.com/**", (route) =>
      route.fulfill({
        contentType: "text/css",
        body: faces
          .map(([family, pkg, weight, style]) =>
            `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:block;` +
            `src:url(/__fonts/${pkg}/files/${pkg}-latin-${weight}-${style}.woff2) format('woff2');}`)
          .join("\n"),
      }),
    );
    await page.route(`${origin}/__fonts/**`, async (route) => {
      const rel = new URL(route.request().url()).pathname.replace("/__fonts/", "");
      await route.fulfill({ contentType: "font/woff2", body: await readFile(path.join(offline, "@fontsource", rel)) });
    });
  }

  await page.goto(`${origin}/${encodeURIComponent(deckFile)}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelectorAll("deck-stage > section").length > 0, null, { timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  const slides = await page.evaluate(() => document.querySelectorAll("deck-stage > section:not([data-deck-skip])").length);

  await page.emulateMedia({ media: "print" });
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  await writeFile(outFile, pdf);

  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
  console.log(`Wrote ${path.relative(root, outFile)}: ${pages} pages for ${slides} slides, ${(pdf.length / 1024).toFixed(0)} KB`);
  if (errors.length) console.warn("Page errors:\n" + errors.join("\n"));
  if (pages !== slides) {
    console.error("Page count does not match the slide count. Check the PDF before publishing it.");
    process.exitCode = 1;
  }
} finally {
  await browser.close();
  server.close();
}
