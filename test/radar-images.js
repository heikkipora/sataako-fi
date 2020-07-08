
import chai from 'chai'
import {fetchRadarImageUrls} from '../src/fmi-radar-frames.js'

const {expect} = chai

describe('FMI rain radar image url resolver', () => {
  it('Should find a set of URLs', async () => {
    const urls = await fetchRadarImageUrls()
    expect(urls.length > 0)
    urls.forEach(url => {
      expect(url).to.have.property('timestamp')
      expect(url).to.have.property('url')
    })
  })
})
