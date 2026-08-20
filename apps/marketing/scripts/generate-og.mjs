/**
 * Generates public/og.png (1200x630) once, so the social card is a real static
 * asset rather than a runtime-rendered route. Re-run with:
 *   node scripts/generate-og.mjs
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#2D6A4F"/>
      <stop offset="100%" stop-color="#E8527A"/>
    </linearGradient>
    <radialGradient id="glowRose" cx="0.75" cy="0.2" r="0.6">
      <stop offset="0%" stop-color="#E8527A" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#E8527A" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowGreen" cx="0.15" cy="0.85" r="0.6">
      <stop offset="0%" stop-color="#2D6A4F" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#2D6A4F" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="#F0EDF0"/>
  <rect width="1200" height="630" fill="url(#glowRose)"/>
  <rect width="1200" height="630" fill="url(#glowGreen)"/>

  <!-- wordmark -->
  <text x="80" y="132" font-family="Segoe UI, Arial, sans-serif" font-size="46" font-weight="800" letter-spacing="-1">
    <tspan fill="#2D6A4F">newdr</tspan><tspan fill="#E8527A">y</tspan><tspan fill="#2D6A4F">ve</tspan>
  </text>

  <!-- eyebrow -->
  <rect x="80" y="180" width="196" height="42" rx="21" fill="#F8F2F4" stroke="#EDE0E5" stroke-width="2"/>
  <circle cx="106" cy="201" r="5" fill="#E8527A"/>
  <text x="122" y="207" font-family="Segoe UI, Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="1.5" fill="#C13B60">NORWICH</text>

  <!-- headline -->
  <text x="80" y="310" font-family="Georgia, Times New Roman, serif" font-size="70" font-weight="600" fill="#0A0A14" letter-spacing="-2">Find a driving instructor</text>
  <text x="80" y="392" font-family="Georgia, Times New Roman, serif" font-size="70" font-weight="600" letter-spacing="-2"><tspan fill="#0A0A14">in Norwich. </tspan><tspan fill="#C13B60">Book in 60s.</tspan></text>

  <!-- subhead -->
  <text x="80" y="460" font-family="Segoe UI, Arial, sans-serif" font-size="27" fill="#5C5C73">DVSA-verified instructors. Real availability. Free for learners.</text>

  <!-- bottom rule and badges -->
  <rect x="80" y="516" width="1040" height="2" fill="#E8E8F2"/>
  <text x="80" y="566" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="700" fill="#2D6A4F">ADI-qualified</text>
  <circle cx="286" cy="559" r="4" fill="#9B9BB5"/>
  <text x="306" y="566" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="700" fill="#2D6A4F">DVSA verified</text>
  <circle cx="516" cy="559" r="4" fill="#9B9BB5"/>
  <text x="536" y="566" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="700" fill="#2D6A4F">0% commission for instructors</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(join(outDir, 'og.png'));

console.log('Wrote public/og.png (1200x630)');
