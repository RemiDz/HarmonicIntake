/**
 * Generate PWA PNG icons from the SVG icon.
 * Run: node scripts/generate-icons.js
 * Requires: sharp (npm install --save-dev sharp)
 *
 * If sharp isn't available, the SVG icon alone works for most modern browsers.
 */
const fs = require('fs');
const path = require('path');

async function generate() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('sharp not installed — skipping PNG generation.');
    console.log('The SVG icon at public/icon.svg will be used instead.');
    console.log('To generate PNGs: npm install --save-dev sharp && node scripts/generate-icons.js');
    return;
  }

  const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');
  const svg = fs.readFileSync(svgPath);

  for (const size of [192, 512]) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, '..', 'public', `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }

  // Also generate OG image (1200x630)
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="#050c15"/>
    <text x="600" y="260" text-anchor="middle" font-family="Georgia, serif" font-size="72" font-weight="300" fill="#d8e8f5">Harmonic Intake</text>
    <text x="600" y="330" text-anchor="middle" font-family="monospace" font-size="20" fill="#507090" letter-spacing="4">DISCOVER YOUR FREQUENCY</text>
    <g transform="translate(600,450)">
      <line x1="-150" y1="0" x2="-130" y2="0" stroke="#4FA8D6" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
      <line x1="-100" y1="-30" x2="-100" y2="30" stroke="#4FA8D6" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
      <line x1="-60" y1="-50" x2="-60" y2="50" stroke="#5ABF7B" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
      <line x1="-20" y1="-70" x2="-20" y2="70" stroke="#7B6DB5" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
      <line x1="20" y1="-80" x2="20" y2="80" stroke="#C77DBA" stroke-width="5" stroke-linecap="round"/>
      <line x1="60" y1="-70" x2="60" y2="70" stroke="#7B6DB5" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
      <line x1="100" y1="-50" x2="100" y2="50" stroke="#5ABF7B" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
      <line x1="140" y1="-30" x2="140" y2="30" stroke="#4FA8D6" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
      <line x1="170" y1="0" x2="190" y2="0" stroke="#4FA8D6" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
    </g>
  </svg>`;

  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'og-image.png'));
  console.log('Generated og-image.png');
}

generate().catch(console.error);
