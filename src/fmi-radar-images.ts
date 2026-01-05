import axios from 'axios'
import sharp from 'sharp'
import type {WMSRequestConfig} from './types.ts'

sharp.cache(false)
sharp.concurrency(1)

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
  const pipeline = sharp(data, {raw: {width, height, channels}})
    .resize({height: height / 2, kernel: 'nearest'})
    .composite([{input: 'src/radar-edges.png'}])
  await pipeline.clone().png().toFile(`${targetFilename}.png`)
  await pipeline.clone().webp({nearLossless: true}).toFile(`${targetFilename}.webp`)
  return false
}

function applyAlphaChannel(data: Buffer): void {
  for (let i = 0; i < data.length; i += 4) {
    const color = data[i] << 16 | data[i + 1] << 8 | data[i + 2]
    if (color === 0xffffff || color === 0xf7f7f7) {
      data[i + 3] = 0
    }
  }
}
