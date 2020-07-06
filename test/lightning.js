
import chai from 'chai'
import {fetchLightnings} from '../src/fmi-lightnings.js'
import dateFns from 'date-fns'

const {expect} = chai
const {setMilliseconds, setMinutes, setSeconds, subMinutes} = dateFns

describe('FMI lightning data set parser', () => {
  it('Should not fail on an empty set of frame dates', async () => {
    const lightnings = await fetchLightnings([])
    expect(lightnings).to.deep.equal([])
  })

  it('Should find some lightning locations (depending on weather naturally)', async () => {
    const time2 = closestFullHour()
    const time1 = subMinutes(time2, 5)
    const frameDates = [time1, time2]
    const lightningFrames = await fetchLightnings(frameDates)
    expect(lightningFrames).to.have.lengthOf(frameDates.length)
    lightningFrames.forEach(lightningFrame => {
      expect(lightningFrame).to.have.property('locations')
      expect(lightningFrame.locations).to.be.an('array')
      lightningFrame.locations.forEach(location => {
        expect(location).to.be.an('array')
        expect(location).have.lengthOf(2)
        expect(location[0]).to.be.a('number')
        expect(location[1]).to.be.a('number')
      })
      expect(lightningFrame).to.have.property('timestamp')
      expect(lightningFrame.timestamp).to.be.a('string')
    })
  })
})

function closestFullHour() {
  return setMinutes(setSeconds(setMilliseconds(Date.now(), 0), 0), 0)
}