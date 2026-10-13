import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

const assetsDir = path.join(process.cwd(), "public", "thedeck-assets");

// "Download PDF": one click downloads the whole deck as a single PDF. The file
// is pre-rendered by `node scripts/export-deck-pdf.mjs`, so re-run that after
// editing the deck. The link carries a hash of the PDF so browsers never hand
// out a stale copy after it is regenerated. The button sits outside <x-dc>,
// the only element the deck runtime replaces, and is hidden from print.
async function downloadButton(): Promise<string> {
  let version = "";
  try {
    const pdf = await readFile(path.join(assetsDir, "Newdryve-Pitch-Deck.pdf"));
    version = `?v=${createHash("sha256").update(pdf).digest("hex").slice(0, 10)}`;
  } catch {
    return "";
  }
  return `
<style>
  #nd-deck-download{position:fixed;top:16px;right:16px;z-index:2147483000;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 18px;border-radius:999px;background:#FF4C86;color:#fff;font:700 15px/1 'Hanken Grotesk',system-ui,sans-serif;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.25);}
  #nd-deck-download:hover{background:#E7397A;color:#fff;}
  #nd-deck-download:focus-visible{outline:3px solid #fff;outline-offset:2px;}
  @media print{#nd-deck-download{display:none !important;}}
</style>
<a id="nd-deck-download" href="/thedeck-assets/Newdryve-Pitch-Deck.pdf${version}" download="Newdryve Pitch Deck.pdf">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
  Download PDF
</a>
`;
}

export async function GET() {
  const html = await readFile(path.join(assetsDir, "Newdryve Pitch.dc.html"), "utf8");
  const routedHtml = html
    .replace('src="./support.js"', 'src="/thedeck-assets/support.js"')
    .replace('from="./deck-stage.js"', 'from="/thedeck-assets/deck-stage.js"')
    .replace("</body>", `${await downloadButton()}</body>`);

  return new Response(routedHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
