import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, 'public')

// Minimal pure-JS PNG encoder (uncompressed/filtered RGBA)
function encodePNG(width, height, rgbaBuffer) {
  const bytesPerPixel = 4
  const lineLength = width * bytesPerPixel
  const rawData = Buffer.alloc(height * (lineLength + 1))

  for (let y = 0; y < height; y++) {
    const rowStart = y * (lineLength + 1)
    rawData[rowStart] = 0 // filter type: None
    rgbaBuffer.copy(rawData, rowStart + 1, y * lineLength, (y + 1) * lineLength)
  }

  const deflated = zlib.deflateSync(rawData, { level: 9 })

  function crc32(buf) {
    let crc = 0xffffffff
    for (let i = 0; i < buf.length; i++) {
      const byte = buf[i]
      crc ^= byte
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
      }
    }
    return (crc ^ 0xffffffff) >>> 0
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length, 0)
    const typeBuf = Buffer.from(type, 'ascii')
    const crcBuf = Buffer.alloc(4)
    const toCrc = Buffer.concat([typeBuf, data])
    crcBuf.writeUInt32BE(crc32(toCrc), 0)
    return Buffer.concat([len, typeBuf, data, crcBuf])
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr)

  // IDAT
  const idatChunk = makeChunk('IDAT', deflated)

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

// Generate the Studio Bru Oliveira branded icon as raw RGBA
function generateIconPixels(size, isMaskable = false) {
  const buf = Buffer.alloc(size * size * 4)

  const BRAND_R = 240,
    BRAND_G = 106,
    BRAND_B = 42 // #F06A2A
  const BRAND_LIGHT_R = 255,
    BRAND_LIGHT_G = 140,
    BRAND_LIGHT_B = 70
  const BG_R = 18,
    BG_G = 18,
    BG_B = 18 // #121212
  const BG_DARK_R = 10,
    BG_DARK_G = 10,
    BG_DARK_B = 10

  const cornerRadius = isMaskable ? 0 : Math.round(size * 0.22)

  // Pre-calculate rounded rectangle distance
  function inRoundedRect(x, y, w, h, r) {
    if (r === 0) return true
    const dx = Math.max(r - x, 0, x - (w - r))
    const dy = Math.max(r - y, 0, y - (h - r))
    return dx * dx + dy * dy <= r * r
  }

  // Draw background
  for (let y = 0; y < size; y++) {
    const ny = y / size
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      if (!inRoundedRect(x, y, size, size, cornerRadius)) {
        buf[idx] = 0
        buf[idx + 1] = 0
        buf[idx + 2] = 0
        buf[idx + 3] = 0
        continue
      }

      // Background gradient
      const bgR = Math.round(BG_R * (1 - ny * 0.4) + BG_DARK_R * (ny * 0.4))
      const bgG = Math.round(BG_G * (1 - ny * 0.4) + BG_DARK_G * (ny * 0.4))
      const bgB = Math.round(BG_B * (1 - ny * 0.4) + BG_DARK_G * (ny * 0.4))

      buf[idx] = bgR
      buf[idx + 1] = bgG
      buf[idx + 2] = bgB
      buf[idx + 3] = 255
    }
  }

  // Draw subtle center glow
  const cx = size / 2
  const cy = size * 0.48
  const glowR = size * 0.38
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      if (buf[idx + 3] === 0) continue
      const dist = Math.hypot(x - cx, y - cy)
      if (dist < glowR) {
        const factor = Math.cos((dist / glowR) * (Math.PI / 2)) * 0.2
        buf[idx] = Math.min(255, Math.round(buf[idx] + BRAND_R * factor))
        buf[idx + 1] = Math.min(255, Math.round(buf[idx + 1] + BRAND_G * factor))
        buf[idx + 2] = Math.min(255, Math.round(buf[idx + 2] + BRAND_B * factor))
      }
    }
  }

  // Draw Stylized "B" Monogram
  // Geometry scaled to size (scaled down slightly if maskable)
  const scale = isMaskable ? 0.76 : 0.88
  const offsetX = (size - 512 * (scale * (size / 512))) / 2
  const s = (size / 512) * scale

  function fillPixel(px, py, r, g, b) {
    if (px < 0 || px >= size || py < 0 || py >= size) return
    const idx = (py * size + px) * 4
    if (buf[idx + 3] === 0) return
    buf[idx] = r
    buf[idx + 1] = g
    buf[idx + 2] = b
    buf[idx + 3] = 255
  }

  // Draw vertical spine of "B"
  const spineX1 = Math.round(offsetX + 144 * s)
  const spineX2 = Math.round(offsetX + (144 + 50) * s)
  const topY = Math.round(size / 2 - 150 * s)
  const botY = Math.round(size / 2 + 140 * s)
  const midY = Math.round(size / 2 - 6 * s)

  for (let y = topY; y <= botY; y++) {
    const ny = (y - topY) / (botY - topY)
    const curR = Math.round(BRAND_LIGHT_R * (1 - ny) + BRAND_R * ny)
    const curG = Math.round(BRAND_LIGHT_G * (1 - ny) + BRAND_G * ny)
    const curB = Math.round(BRAND_LIGHT_B * (1 - ny) + BRAND_B * ny)

    for (let x = spineX1; x <= spineX2; x++) {
      fillPixel(x, y, curR, curG, curB)
    }
  }

  // Helper for arc lobes of "B"
  function drawLobe(centerX, centerY, outerR, innerR, yMin, yMax) {
    for (let y = yMin; y <= yMax; y++) {
      const ny = (y - topY) / (botY - topY)
      const curR = Math.round(BRAND_LIGHT_R * (1 - ny) + BRAND_R * ny)
      const curG = Math.round(BRAND_LIGHT_G * (1 - ny) + BRAND_G * ny)
      const curB = Math.round(BRAND_LIGHT_B * (1 - ny) + BRAND_B * ny)

      for (let x = spineX1; x <= centerX + outerR; x++) {
        const dx = Math.max(0, x - centerX)
        const dy = y - centerY
        const d = Math.hypot(dx, dy)
        if (d <= outerR) {
          if (d >= innerR || x < centerX) {
            fillPixel(x, y, curR, curG, curB)
          }
        }
      }
    }
  }

  const topLobeCenterY = Math.round(topY + (midY - topY) / 2)
  const topLobeRadius = Math.round((midY - topY) / 2)
  const topInnerRadius = Math.round(topLobeRadius * 0.44)
  const topLobeCenterX = Math.round(spineX2 + 30 * s)

  // Top horizontal bars & lobe
  for (let y = topY; y < topY + (topLobeRadius - topInnerRadius); y++) {
    for (let x = spineX2; x <= topLobeCenterX; x++) {
      fillPixel(x, y, BRAND_LIGHT_R, BRAND_LIGHT_G, BRAND_LIGHT_B)
    }
  }
  for (let y = midY - (topLobeRadius - topInnerRadius); y <= midY; y++) {
    for (let x = spineX2; x <= topLobeCenterX; x++) {
      fillPixel(x, y, BRAND_R, BRAND_G, BRAND_B)
    }
  }
  drawLobe(topLobeCenterX, topLobeCenterY, topLobeRadius, topInnerRadius, topY, midY)

  // Bottom lobe (slightly wider)
  const botLobeCenterY = Math.round(midY + (botY - midY) / 2)
  const botLobeRadius = Math.round((botY - midY) / 2)
  const botInnerRadius = Math.round(botLobeRadius * 0.46)
  const botLobeCenterX = Math.round(spineX2 + 44 * s)

  for (let y = midY; y <= midY + (botLobeRadius - botInnerRadius); y++) {
    for (let x = spineX2; x <= botLobeCenterX; x++) {
      fillPixel(x, y, BRAND_R, BRAND_G, BRAND_B)
    }
  }
  for (let y = botY - (botLobeRadius - botInnerRadius); y <= botY; y++) {
    for (let x = spineX2; x <= botLobeCenterX; x++) {
      fillPixel(x, y, BRAND_R, BRAND_G, BRAND_B)
    }
  }
  drawLobe(botLobeCenterX, botLobeCenterY, botLobeRadius, botInnerRadius, midY, botY)

  // Draw Dumbbell accent on the right side of the B
  const dbX = Math.round(botLobeCenterX + botLobeRadius + 16 * s)
  const dbY = midY
  const barHalfLen = Math.round(18 * s)
  const barThick = Math.max(2, Math.round(4 * s))

  // bar
  for (let x = dbX - barHalfLen; x <= dbX + barHalfLen; x++) {
    for (let y = dbY - barThick; y <= dbY + barThick; y++) {
      fillPixel(x, y, 240, 240, 240)
    }
  }
  // weights
  const weightH = Math.round(14 * s)
  const weightW = Math.max(2, Math.round(5 * s))
  for (let x = dbX - barHalfLen - weightW; x <= dbX - barHalfLen; x++) {
    for (let y = dbY - weightH; y <= dbY + weightH; y++) {
      fillPixel(x, y, BRAND_LIGHT_R, BRAND_LIGHT_G, BRAND_LIGHT_B)
    }
  }
  for (let x = dbX + barHalfLen; x <= dbX + barHalfLen + weightW; x++) {
    for (let y = dbY - weightH; y <= dbY + weightH; y++) {
      fillPixel(x, y, BRAND_LIGHT_R, BRAND_LIGHT_G, BRAND_LIGHT_B)
    }
  }

  return buf
}

// Generate files
const sizes = [
  { name: 'pwa-192x192.png', size: 192, maskable: false },
  { name: 'pwa-512x512.png', size: 512, maskable: false },
  { name: 'pwa-maskable-192x192.png', size: 192, maskable: true },
  { name: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
  { name: 'apple-touch-icon-180x180.png', size: 180, maskable: false },
  { name: 'favicon-32x32.png', size: 32, maskable: false },
  { name: 'favicon-16x16.png', size: 16, maskable: false },
]

for (const { name, size, maskable } of sizes) {
  const pixels = generateIconPixels(size, maskable)
  const png = encodePNG(size, size, pixels)
  fs.writeFileSync(path.join(publicDir, name), png)
  console.log(`Generated ${name} (${size}x${size}) - ${png.length} bytes`)
}
