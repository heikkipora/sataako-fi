const axios = require('axios')
const sharp = require('sharp')

async function fetchPostProcessedRadarFrameAsPng(url) {
  const data = await fetchRadarImage(url)
  return processPng(data)
}

async function fetchRadarImage(url) {
  const response = await axios({url, method: 'get', responseType: 'arraybuffer'})
  return Buffer.from(response.data)
}

async function processPng(input) {
  const {data, info} = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true})

  applyAlphaChannel(data)

  const {width, height, channels} = info
  return sharp(data, {raw: {width, height, channels}})
    .overlayWith(`${__dirname}/radar-edges.png`)
    .png()
    .toBuffer()
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
  fetchPostProcessedRadarFrameAsPng
}
