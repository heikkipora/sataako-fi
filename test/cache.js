
import chai from 'chai'
import {framesList, imageFileForTimestamp, initializeCache, refreshCache} from '../src/cache.js'

const {expect} = chai

describe('Radar image and lightning cache', () => {
  before(initializeCache)

  it('Should populate cache with latest radar images and lightning locations', async() => {
    await refreshCache(4, 120, true)

    const frames = framesList(3, 'http://localhost/')
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

  it('Should resolve cached files only', async() => {
    await refreshCache(2, 120, true)

    const nonExistent = imageFileForTimestamp(new Date().toISOString())
    expect(nonExistent).to.equal(null)

    const [{timestamp}] = framesList(1, '')
    const imageFiles = imageFileForTimestamp(timestamp)
    expect(imageFiles).to.have.property('png')
    expect(imageFiles).to.have.property('webp')
  })
})
