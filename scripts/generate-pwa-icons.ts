// Generate the full PWA + Play Store icon set from the brand metallic logo.
// Usage: pnpm pwa:icons
//
// Outputs:
//   public/icons/icon-{192,256,384,512}.png  — `purpose: "any"` PWA icons
//   public/icons/icon-512-maskable.png       — `purpose: "maskable"` (with safe-area pad on brand-stone background)
//   marketing/play-store/icon-512.png        — Play Console listing icon (high-detail, on stone background)

import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(ROOT, '..', '..')
const SRC = path.resolve(REPO_ROOT, 'COK-City-of-Karis', 'brand_assets', 'COK-Logo-Main-Metallic-NoGuyana-NoBKG.png')
const OUT = path.resolve(ROOT, 'public', 'icons')
const PLAY_OUT = path.resolve(REPO_ROOT, 'COK-City-of-Karis', 'marketing', 'play-store')

const STONE_50 = { r: 253, g: 252, b: 251, alpha: 1 } // #FDFCFB

async function rasterizeAny(size: number, dest: string) {
  // PWA `purpose: "any"`: full-bleed logo on transparent background.
  await sharp(SRC)
    .resize({ width: size, height: size, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(dest)
  console.log(`  wrote ${path.relative(REPO_ROOT, dest)} (${size}×${size}, transparent)`)
}

async function rasterizeMaskable(size: number, dest: string) {
  // PWA `purpose: "maskable"`: logo padded into 80% safe-area on stone background.
  // Per spec the logo must fit inside a circle of diameter = 0.8 × size; use 0.7 for headroom.
  const inner = Math.round(size * 0.7)
  const logo = await sharp(SRC)
    .resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  await sharp({
    create: { width: size, height: size, channels: 4, background: STONE_50 },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(dest)
  console.log(`  wrote ${path.relative(REPO_ROOT, dest)} (${size}×${size}, maskable safe-area)`)
}

async function rasterizePlayStoreIcon(dest: string) {
  // Play Console listing icon: 512×512 PNG, recommended on solid background, high detail.
  const inner = 384
  const logo = await sharp(SRC)
    .resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  await sharp({
    create: { width: 512, height: 512, channels: 4, background: STONE_50 },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(dest)
  console.log(`  wrote ${path.relative(REPO_ROOT, dest)} (512×512, Play Console listing)`)
}

async function main() {
  console.log(`Generating PWA + Play Store icons from ${path.relative(REPO_ROOT, SRC)}`)
  await mkdir(OUT, { recursive: true })
  await mkdir(PLAY_OUT, { recursive: true })

  await rasterizeAny(192, path.join(OUT, 'icon-192.png'))
  await rasterizeAny(256, path.join(OUT, 'icon-256.png'))
  await rasterizeAny(384, path.join(OUT, 'icon-384.png'))
  await rasterizeAny(512, path.join(OUT, 'icon-512.png'))
  await rasterizeMaskable(512, path.join(OUT, 'icon-512-maskable.png'))
  await rasterizePlayStoreIcon(path.join(PLAY_OUT, 'icon-512.png'))

  console.log('done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
