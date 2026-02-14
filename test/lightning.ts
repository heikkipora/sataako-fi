import {describe, it} from 'node:test'
import assert from 'node:assert/strict'
import {fetchLightnings} from '../src/fmi-lightnings.ts'
import {setMilliseconds, setMinutes, setSeconds, subMinutes} from 'date-fns'
import type {LightningCacheItem} from '../src/types.ts'

describe('FMI lightning data set parser', () => {
  it('Should not fail on an empty set of frame dates', async () => {
    const lightnings = await fetchLightnings([])
    assert.deepStrictEqual(lightnings, [])
  })

  it('Should parse large set of lightning locations from local FMI data', async () => {
    const frameDates = [new Date('2019-06-07T13:55:00Z'), new Date('2019-06-07T14:00:00Z')]
    const lightningFrames = await fetchLightnings(frameDates, true)
    verifyLightningStructure(lightningFrames, frameDates)

    assert.equal(lightningFrames[0].locations.length, 0)
    assert.equal(lightningFrames[1].locations.length, 1809)
  })

  it('Should find some lightning locations (depending on weather naturally) from FMI API', async () => {
    const time2 = closestFullHour()
    const time1 = subMinutes(time2, 5)
    const frameDates = [time1, time2]
    const lightningFrames = await fetchLightnings(frameDates)
    verifyLightningStructure(lightningFrames, frameDates)
  })
})

function verifyLightningStructure(lightningFrames: LightningCacheItem[], frameDates: Date[]): void {
  assert.equal(lightningFrames.length, frameDates.length)
  lightningFrames.forEach(lightningFrame => {
    assert.ok(Array.isArray(lightningFrame.locations))
    lightningFrame.locations.forEach(location => {
      assert.ok(Array.isArray(location))
      assert.equal(location.length, 2)
      assert.equal(typeof location[0], 'number')
      assert.equal(typeof location[1], 'number')
    })
    assert.equal(typeof lightningFrame.timestamp, 'string')
  })
}

function closestFullHour(): Date {
  return setMinutes(setSeconds(setMilliseconds(Date.now(), 0), 0), 0)
}
