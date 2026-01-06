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

  applyAlphaChannel(data)

  const {width, height, channels} = info
  const edgeImage = await generateEdgeImage(data, width, height)

  const pipeline = sharp(data, {raw: {width, height, channels}})
    .resize({height: height / 2, kernel: 'nearest'})
    .composite([{input: edgeImage}])
  
  await pipeline.clone().png().toFile(`${targetFilename}.png`)
  await pipeline.clone().webp({nearLossless: true}).toFile(`${targetFilename}.webp`)
  return false
}

function applyAlphaChannel(data: Buffer): void {
  for (let i = 0; i < data.length; i += 4) {
    const color = data[i] << 16 | data[i + 1] << 8 | data[i + 2]
    if (color === RADAR_BACKGROUND_COLOR || color === RADAR_OUTSIDE_COLOR) {
      data[i + 3] = 0
    }
  }
}

async function generateEdgeImage(data: Buffer, width: number, height: number, edgeThickness: number = 3): Promise<Buffer> {
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
    .resize({height: height / 2, kernel: 'nearest'})
    .png()
    .toBuffer()
}
