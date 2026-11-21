import { deflateSync } from 'node:zlib'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const project = fileURLToPath(new URL('../', import.meta.url))
const supersample = 2
const size = 512
const canvasSize = size * supersample
const pixels = Buffer.alloc(canvasSize * canvasSize * 4)

function blendPixel(x, y, color) {
  const offset = (Math.floor(y) * canvasSize + Math.floor(x)) * 4
  const alpha = color[3] / 255
  pixels[offset] = Math.round(color[0] * alpha + pixels[offset] * (1 - alpha))
  pixels[offset + 1] = Math.round(color[1] * alpha + pixels[offset + 1] * (1 - alpha))
  pixels[offset + 2] = Math.round(color[2] * alpha + pixels[offset + 2] * (1 - alpha))
  pixels[offset + 3] = Math.round(255 * (alpha + (pixels[offset + 3] / 255) * (1 - alpha)))
}

function gradient(t, a, b) {
  return a.map((value, channel) => Math.round(value + (b[channel] - value) * t))
}

function roundedRect(x, y, width, height, radius, color) {
  const scale = supersample
  const left = Math.round(x * scale)
  const top = Math.round(y * scale)
  const right = Math.round((x + width) * scale)
  const bottom = Math.round((y + height) * scale)
  const r = radius * scale
  for (let py = top; py < bottom; py++) {
    for (let px = left; px < right; px++) {
      const cx = px < left + r ? left + r : px > right - r ? right - r : px
      const cy = py < top + r ? top + r : py > bottom - r ? bottom - r : py
      if ((px - cx) ** 2 + (py - cy) ** 2 <= r ** 2) {
        const t = (px - left + (py - top)) / (right - left + (bottom - top))
        blendPixel(px, py, [...gradient(t, [36, 20, 31], [8, 9, 13]), color?.[3] ?? 255])
      }
    }
  }
}

function insidePolygon(x, y, points) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i]
    const [xj, yj] = points[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function polygon(points, start, end) {
  const minX = Math.min(...points.map(([x]) => x)) * supersample
  const maxX = Math.max(...points.map(([x]) => x)) * supersample
  const minY = Math.min(...points.map(([, y]) => y)) * supersample
  const maxY = Math.max(...points.map(([, y]) => y)) * supersample
  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      if (!insidePolygon(px / supersample, py / supersample, points)) continue
      const t = (px / supersample + py / supersample) / 1024
      blendPixel(px, py, [...gradient(t, start, end), 255])
    }
  }
}

function line(x1, y1, x2, y2, width, color) {
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSquared = dx * dx + dy * dy
  const radius = width / 2
  const left = Math.max(0, Math.floor((Math.min(x1, x2) - radius) * supersample))
  const right = Math.min(canvasSize, Math.ceil((Math.max(x1, x2) + radius) * supersample))
  const top = Math.max(0, Math.floor((Math.min(y1, y2) - radius) * supersample))
  const bottom = Math.min(canvasSize, Math.ceil((Math.max(y1, y2) + radius) * supersample))
  for (let py = top; py < bottom; py++) {
    for (let px = left; px < right; px++) {
      const x = px / supersample
      const y = py / supersample
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared))
      if ((x - (x1 + t * dx)) ** 2 + (y - (y1 + t * dy)) ** 2 <= radius ** 2) {
        blendPixel(px, py, color)
      }
    }
  }
}

roundedRect(18, 18, 476, 476, 124)
polygon(
  [
    [256, 68],
    [402, 152],
    [402, 320],
    [256, 404],
    [110, 320],
    [110, 152]
  ],
  [18, 14, 21],
  [12, 11, 16]
)
for (let index = 0; index < 6; index++) {
  const a = [
    [256, 68],
    [402, 152],
    [402, 320],
    [256, 404],
    [110, 320],
    [110, 152],
    [256, 68]
  ][index]
  const b = [
    [256, 68],
    [402, 152],
    [402, 320],
    [256, 404],
    [110, 320],
    [110, 152],
    [256, 68]
  ][index + 1]
  line(a[0], a[1], b[0], b[1], 10, [255, 49, 95, 255])
}
polygon(
  [
    [179, 152],
    [233, 152],
    [233, 234],
    [280, 234],
    [280, 152],
    [334, 152],
    [334, 360],
    [280, 360],
    [280, 286],
    [233, 286],
    [233, 360],
    [179, 360]
  ],
  [255, 245, 246],
  [255, 81, 118]
)
line(198, 140, 256, 98, 8, [255, 49, 95, 255])
line(256, 98, 314, 140, 8, [255, 49, 95, 255])
polygon(
  [
    [265, 96],
    [286, 122],
    [265, 151],
    [244, 122]
  ],
  [255, 49, 95],
  [227, 51, 172]
)

const raw = Buffer.alloc(size * size * 4)
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const target = (y * size + x) * 4
    for (let channel = 0; channel < 4; channel++) {
      const source = [
        pixels[(y * 2 * canvasSize + x * 2) * 4 + channel],
        pixels[(y * 2 * canvasSize + x * 2 + 1) * 4 + channel],
        pixels[((y * 2 + 1) * canvasSize + x * 2) * 4 + channel],
        pixels[((y * 2 + 1) * canvasSize + x * 2 + 1) * 4 + channel]
      ]
      raw[target + channel] = Math.round(source.reduce((sum, value) => sum + value, 0) / 4)
    }
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(name, data) {
  const type = Buffer.from(name)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([type, data])))
  return Buffer.concat([length, type, data, crc])
}
function encodePng(width, height, rgba) {
  const rows = Buffer.alloc(height * (width * 4 + 1))
  for (let y = 0; y < height; y++)
    rgba.copy(rows, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0))
  ])
}

const png = encodePng(size, size, raw)
const icoSize = 256
const icoPixels = Buffer.alloc(icoSize * icoSize * 4)
for (let y = 0; y < icoSize; y++) {
  for (let x = 0; x < icoSize; x++) {
    const target = (y * icoSize + x) * 4
    for (let channel = 0; channel < 4; channel++) {
      const source = [
        raw[(y * 2 * size + x * 2) * 4 + channel],
        raw[(y * 2 * size + x * 2 + 1) * 4 + channel],
        raw[((y * 2 + 1) * size + x * 2) * 4 + channel],
        raw[((y * 2 + 1) * size + x * 2 + 1) * 4 + channel]
      ]
      icoPixels[target + channel] = Math.round(source.reduce((sum, value) => sum + value, 0) / 4)
    }
  }
}
const icoPng = encodePng(icoSize, icoSize, icoPixels)
const outputs = [
  join(project, 'build', 'icon.png'),
  join(project, 'resources', 'icon.png'),
  join(project, 'src', 'renderer', 'src', 'assets', 'browser-mark.png')
]
for (const output of outputs) {
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, png)
}

const icoHeader = Buffer.alloc(22)
icoHeader.writeUInt16LE(0, 0)
icoHeader.writeUInt16LE(1, 2)
icoHeader.writeUInt16LE(1, 4)
icoHeader[6] = 0
icoHeader[7] = 0
icoHeader[8] = 0
icoHeader[9] = 0
icoHeader.writeUInt16LE(1, 10)
icoHeader.writeUInt16LE(32, 12)
icoHeader.writeUInt32LE(icoPng.length, 14)
icoHeader.writeUInt32LE(22, 18)
await writeFile(join(project, 'build', 'icon.ico'), Buffer.concat([icoHeader, icoPng]))

const icnsChunk = Buffer.alloc(8)
icnsChunk.write('ic09', 0)
icnsChunk.writeUInt32BE(png.length + 8, 4)
const icnsBody = Buffer.concat([icnsChunk, png])
const icnsHeader = Buffer.alloc(8)
icnsHeader.write('icns', 0)
icnsHeader.writeUInt32BE(icnsBody.length + 8, 4)
await writeFile(join(project, 'build', 'icon.icns'), Buffer.concat([icnsHeader, icnsBody]))

console.log(
  'Updated Hrishikesh Gaming icons:',
  ...outputs.map((path) => path.replace(project, '.'))
)
