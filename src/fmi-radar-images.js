import axios from 'axios'
import sharp from 'sharp'

sharp.cache(false)
sharp.concurrency(1)

export async function fetchPostProcessedRadarFrame(requestConfig, targetFilename) {
  const {data} = await axios(requestConfig)
  return processImage(data, targetFilename)
}

async function processImage(input, targetFilename) {
  const {data, info} = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true})

  if (isAllWhite(data)) {
    return true
  }

  applyAlphaChannel(data)

  const {width, height, channels} = info
  const pipeline = sharp(data, {raw: {width, height, channels}})
    .resize({height: height / 2, kernel: 'nearest'})
    .composite([{input: 'src/radar-edges.png'}])
  await pipeline.clone().png().toFile(`${targetFilename}.png`)
  await pipeline.clone().webp({nearLossless: true}).toFile(`${targetFilename}.webp`)
  return false
}

function isAllWhite(data) {
  for (let i = 0; i < data.length; i += 4) {
    // eslint-disable-next-line no-bitwise, no-mixed-operators
    const color = data[i] << 16 | data[i + 1] << 8 | data[i + 2]
    if (color !== 0xffffff) {
      return false
    }
  }
  return true
}

function applyAlphaChannel(data) {
  for (let i = 0; i < data.length; i += 4) {
    // eslint-disable-next-line no-bitwise, no-mixed-operators
    const color = data[i] << 16 | data[i + 1] << 8 | data[i + 2]
    if (color === 0xffffff || color === 0xf7f7f7) {
      data[i + 3] = 0
    }
  }
}
