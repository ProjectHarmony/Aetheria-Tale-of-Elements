// One-off/rerunnable icon generator: rasterizes icon-source.svg into every
// PNG size the PWA manifest + apple-touch-icon need. Run with:
//   node scripts/generate-icons.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '..', 'icon-source.svg');
const outDir = path.join(__dirname, '..', 'public');

const targets = [
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'pwa-maskable-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon-32x32.png', size: 32 },
];

for (const { file, size } of targets) {
  await sharp(src, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, file));
  console.log(`wrote ${file} (${size}x${size})`);
}
