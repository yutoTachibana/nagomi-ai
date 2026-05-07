/**
 * public/icon.svg から PNG アイコン (192/512/180) を生成する.
 * Apple-touch-icon は背景が白であってほしい (iOS の角丸マスク前提) ので
 * 同じ SVG をそのまま使う.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');
const outDir = path.join(__dirname, '..', 'public');
const svg = fs.readFileSync(svgPath);

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function main() {
  for (const { name, size } of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, name));
    console.log(`Generated ${name} (${size}x${size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
