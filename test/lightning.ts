import {expect} from 'chai'
import {fetchLightnings} from '../src/fmi-lightnings.ts'
import {setMilliseconds, setMinutes, setSeconds, subMinutes} from 'date-fns'
import type {LightningCacheItem} from '../src/types.ts'

describe('FMI lightning data set parser', () => {
  it('Should not fail on an empty set of frame dates', async () => {
    const lightnings = await fetchLightnings([])
    expect(lightnings).to.deep.equal([])
  })

  it('Should parse large set of lightning locations from local FMI data', async () => {
    const frameDates = [new Date('2019-06-07T13:55:00Z'), new Date('2019-06-07T14:00:00Z')]
    const lightningFrames = await fetchLightnings(frameDates, true)
    verifyLightningStructure(lightningFrames, frameDates)

    expect(lightningFrames[0].locations).to.have.lengthOf(0)
    expect(lightningFrames[1].locations).to.have.lengthOf(1809)
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
  expect(lightningFrames).to.have.lengthOf(frameDates.length)
  lightningFrames.forEach(lightningFrame => {
    expect(lightningFrame).to.have.property('locations')
    expect(lightningFrame.locations).to.be.an('array')
    lightningFrame.locations.forEach(location => {
      expect(location).to.be.an('array')
      expect(location).to.have.lengthOf(2)
      expect(location[0]).to.be.a('number')
      expect(location[1]).to.be.a('number')
    })
    expect(lightningFrame).to.have.property('timestamp')
    expect(lightningFrame.timestamp).to.be.a('string')
  })
}

function closestFullHour(): Date {
  return setMinutes(setSeconds(setMilliseconds(Date.now(), 0), 0), 0)
}
