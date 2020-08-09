
import chai from 'chai'
import {
  imageFileForRadarTimestamp,
  initializeCaches,
  radarEstimateFramesList,
  radarFramesList,
  refreshLightningCache,
  refreshRadarCache,
  refreshRadarEstimateCache
} from '../src/cache.js'

const {expect} = chai

describe('Radar image and lightning cache', () => {
  before(initializeCaches)

  it('Should populate cache with latest radar images and lightning locations', async() => {
    await refreshRadarCache(4, 0, true)
    await refreshLightningCache(0, true)

    const frames = radarFramesList(3, 'http://localhost/')
    expect(frames).to.have.lengthOf(3)
    frames.forEach(frame => {
      expect(frame).to.have.property('image')
      expect(frame.image).to.be.a('string')
      expect(frame).to.have.property('timestamp')
      expect(frame.timestamp).to.be.a('string')
      expect(frame).to.have.property('lightnings')
      expect(frame.lightnings).to.be.an('array')
    })
  })

  it('Should populate cache with latest radar estimate images', async() => {
    await refreshRadarEstimateCache(4, 0, true)

    const frames = radarEstimateFramesList(4, 'http://localhost/')
    expect(frames).to.have.lengthOf(4)
    frames.forEach(frame => {
      expect(frame).to.have.property('image')
      expect(frame.image).to.be.a('string')
      expect(frame).to.have.property('timestamp')
      expect(frame.timestamp).to.be.a('string')
      expect(frame).to.have.property('lightnings')
      expect(frame.lightnings).to.be.an('array')
    })
  })

  it('Should resolve cached files only', async() => {
    await refreshRadarCache(2, 0, true)

    const nonExistent = imageFileForRadarTimestamp(new Date().toISOString())
    expect(nonExistent).to.equal(null)

    const [{timestamp}] = radarFramesList(1, '')
    const imageFiles = imageFileForRadarTimestamp(timestamp)
    expect(imageFiles).to.have.property('png')
    expect(imageFiles).to.have.property('webp')
  })
})
