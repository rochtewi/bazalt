// Rasterize the app icon at the sizes iOS and the web manifest need.
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const src = join(root, 'scripts', 'icon.svg')
const out = join(root, 'public', 'icons')
await mkdir(out, { recursive: true })

const targets = [
  { file: 'icon-180.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
]
for (const t of targets) {
  await sharp(src).resize(t.size, t.size).png().toFile(join(out, t.file))
}

// Maskable: same art with safe-zone padding on a solid background.
await sharp(src)
  .resize(410, 410)
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: '#0d0e11' })
  .flatten({ background: '#0d0e11' })
  .png()
  .toFile(join(out, 'icon-maskable-512.png'))

console.log('Icons written to public/icons')
