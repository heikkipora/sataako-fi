const axios = require('axios')
const sharp = require('sharp')

sharp.cache(false)

async function fetchPostProcessedRadarFrame(url) {
  const data = await fetchRadarImage(url)
  return processImage(data)
}

async function fetchRadarImage(url) {
  const response = await axios({url, method: 'get', responseType: 'arraybuffer'})
  return Buffer.from(response.data)
}

async function processImage(input) {
  const {data, info} = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true})

  applyAlphaChannel(data)

  const {width, height, channels} = info
  const pipeline = sharp(data, {raw: {width, height, channels}})
    .overlayWith(`${__dirname}/radar-edges.png`)
  const png = await pipeline.clone().png().toBuffer()
  const webp = await pipeline.clone().webp({nearLossless: true}).toBuffer()
  return {png, webp}
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

module.exports = {
  fetchPostProcessedRadarFrame
}
