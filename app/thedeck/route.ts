import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

export async function GET() {
  const deckPath = path.join(
    process.cwd(),
    "public",
    "thedeck-assets",
    "Newdryve Pitch.dc.html",
  );

  const html = await readFile(deckPath, "utf8");
  const routedHtml = html
    .replace('src="./support.js"', 'src="/thedeck-assets/support.js"')
    .replace('from="./deck-stage.js"', 'from="/thedeck-assets/deck-stage.js"');

  return new Response(routedHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
