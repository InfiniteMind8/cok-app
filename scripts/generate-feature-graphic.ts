// Generate the Play Console feature graphic.
// Usage: pnpm pwa:graphic
//
// Output: marketing/play-store/feature-graphic.png  — 1024×500 PNG
// Composition: brand-green base layer, metallic logo centered-left, brand tagline in gold.

import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(ROOT, '..', '..')
const SRC_LOGO = path.resolve(REPO_ROOT, 'COK-City-of-Karis', 'brand_assets', 'COK-Logo-Main-Metallic-NoGuyana-NoBKG.png')
const OUT = path.resolve(REPO_ROOT, 'COK-City-of-Karis', 'marketing', 'play-store')
const DEST = path.join(OUT, 'feature-graphic.png')

const W = 1024
const H = 500

// Brand tokens (in 0–255 RGB). Source: app/globals.css.
// karis-green-900 ≈ oklch(0.20 0.05 155) ≈ #1E2E23
// karis-gold-500 ≈ oklch(0.72 0.13 75)  ≈ #C99A52
// karis-stone-50  (foreground accent)    ≈ #FDFCFB
const BRAND_GREEN = { r: 30, g: 46, b: 35, alpha: 1 }

function svgOverlay() {
  // Plain SVG so the build environment doesn't need a font file — sharp ships its own renderer.
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#E0BD7E"/>
        <stop offset="100%" stop-color="#C99A52"/>
      </linearGradient>
    </defs>
    <text x="520" y="220" font-family="Georgia, 'Times New Roman', serif" font-weight="500" font-size="64" fill="#FDFCFB" letter-spacing="2">
      City of Karis
    </text>
    <text x="520" y="270" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="28" fill="url(#goldGrad)" letter-spacing="1">
      Beautiful, Empowered Living
    </text>
    <text x="520" y="305" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="28" fill="url(#goldGrad)" letter-spacing="1">
      in Guyana
    </text>
    <line x1="520" y1="335" x2="640" y2="335" stroke="url(#goldGrad)" stroke-width="2"/>
    <text x="520" y="380" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#FDFCFB" opacity="0.75" letter-spacing="3">
      THE COMMUNITY APP
    </text>
  </svg>`
}

async function main() {
  console.log(`Generating feature graphic → ${path.relative(REPO_ROOT, DEST)}`)
  await mkdir(OUT, { recursive: true })

  const logo = await sharp(SRC_LOGO)
    .resize({ width: 380, height: 380, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  await sharp({
    create: { width: W, height: H, channels: 4, background: BRAND_GREEN },
  })
    .composite([
      { input: logo, top: 60, left: 70 },
      { input: Buffer.from(svgOverlay()), top: 0, left: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(DEST)

  console.log(`done. ${W}×${H}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
