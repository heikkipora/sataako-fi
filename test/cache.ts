import {describe, it, before} from 'node:test'
import assert from 'node:assert/strict'
import {framesList, imageFileForTimestamp, initializeCache, refreshCache} from '../src/cache.ts'

describe('Radar image and lightning cache', () => {
  before(initializeCache)

  it('Should populate cache with latest radar images and lightning locations', {timeout: 30000}, async() => {
    await refreshCache(4, 120, true)

    const frames = framesList(3, 'http://localhost/')
    assert.equal(frames.length, 3)
    frames.forEach(frame => {
      assert.equal(typeof frame.image, 'string')
      assert.equal(typeof frame.timestamp, 'string')
      assert.ok(Array.isArray(frame.lightnings))
    })
  })

  it('Should resolve cached files only', async() => {
    await refreshCache(2, 120, true)

    const nonExistent = imageFileForTimestamp(new Date().toISOString())
    assert.equal(nonExistent, null)

    const [{timestamp}] = framesList(1, '')
    const imageFile = imageFileForTimestamp(timestamp)
    assert.ok(imageFile)
    assert.ok(imageFile.endsWith('.webp'))
  })
})
