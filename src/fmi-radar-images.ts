import axios from 'axios'
import sharp from 'sharp'
import type {WMSRequestConfig} from './types.ts'

sharp.cache(false)
sharp.concurrency(1)

const RADAR_BACKGROUND_COLOR = 0xffffff
const RADAR_OUTSIDE_COLOR = 0xf7f7f7

export async function fetchPostProcessedRadarFrame(requestConfig: WMSRequestConfig, targetFilename: string): Promise<boolean> {
  const {data, headers} = await axios(requestConfig)
  if (headers['content-type'] !== 'image/png') {
    // Typically an XML error message ("Could not find a match for "time" value: "<timestamp>") for
    // a time value that does not yet have radar data available.
    return true
  }
  return processImage(data, targetFilename)
}

async function processImage(input: Buffer, targetFilename: string): Promise<boolean> {
  const {data, info} = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true})

  const {width, height, channels} = info
  fillBorderWhiteWithOutsideColor(data, width, height)
  applyAlphaChannel(data)

  const edgeImage = await generateEdgeImage(data, width, height)

  const pipeline = sharp(data, {raw: {width, height, channels}})
    .composite([{input: edgeImage}])
  
  await pipeline.webp({nearLossless: true}).toFile(`${targetFilename}.webp`)
  return false
}

function fillBorderWhiteWithOutsideColor(data: Buffer, width: number, height: number): void {
  const visited = new Uint8Array(width * height)
  const stack: number[] = []

  function enqueue(x: number, y: number) {
    const idx = y * width + x
    if (visited[idx]) return
    const i = idx * 4
    if ((data[i] << 16 | data[i + 1] << 8 | data[i + 2]) !== RADAR_BACKGROUND_COLOR) return
    visited[idx] = 1
    stack.push(idx)
  }

  for (let x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1) }
  for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y) }

  while (stack.length > 0) {
    const idx = stack.pop()!
    const x = idx % width
    const y = (idx - x) / width
    const i = idx * 4
    data[i] = 0xf7; data[i + 1] = 0xf7; data[i + 2] = 0xf7

    if (x > 0) enqueue(x - 1, y)
    if (x < width - 1) enqueue(x + 1, y)
    if (y > 0) enqueue(x, y - 1)
    if (y < height - 1) enqueue(x, y + 1)
  }
}

function applyAlphaChannel(data: Buffer): void {
  for (let i = 0; i < data.length; i += 4) {
    const color = data[i] << 16 | data[i + 1] << 8 | data[i + 2]
    if (color === RADAR_BACKGROUND_COLOR || color === RADAR_OUTSIDE_COLOR) {
      data[i + 3] = 0
    }
  }
}

async function generateEdgeImage(data: Buffer, width: number, height: number, edgeThickness: number = 2): Promise<Buffer> {
  const edgeData = Buffer.alloc(width * height * 4, 0)

  // First pass: detect edge pixels
  const isEdgePixel = new Array(width * height).fill(false)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const color = data[i] << 16 | data[i + 1] << 8 | data[i + 2]

      if (color === RADAR_OUTSIDE_COLOR) {
        // Check 8-connected neighbors
        let hasInsideNeighbor = false
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const nx = x + dx
            const ny = y + dy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const ni = (ny * width + nx) * 4
              const neighborColor = data[ni] << 16 | data[ni + 1] << 8 | data[ni + 2]
              if (neighborColor !== RADAR_OUTSIDE_COLOR) {
                hasInsideNeighbor = true
                break
              }
            }
          }
          if (hasInsideNeighbor) break
        }

        if (hasInsideNeighbor) {
          isEdgePixel[y * width + x] = true
        }
      }
    }
  }

  // Second pass: draw thick edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isEdgePixel[y * width + x]) {
        // Draw edge pixel and surrounding pixels within thickness radius
        for (let dy = -(edgeThickness - 1); dy <= (edgeThickness - 1); dy++) {
          for (let dx = -(edgeThickness - 1); dx <= (edgeThickness - 1); dx++) {
            const nx = x + dx
            const ny = y + dy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const i = (ny * width + nx) * 4
              edgeData[i] = 0       // R
              edgeData[i + 1] = 127 // G
              edgeData[i + 2] = 255 // B
              edgeData[i + 3] = 255 // A
            }
          }
        }
      }
    }
  }

  return sharp(edgeData, {raw: {width, height, channels: 4}})
    .png({compressionLevel: 0})
    .toBuffer()
}
