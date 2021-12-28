
import chai from 'chai'
import {generateRadarFrameTimestamps, wmsRequestForRadar, wmsRequestForRadarEstimate} from '../src/fmi-radar-frames.js'

const {expect} = chai

describe('FMI rain radar wms request generator', () => {
  it('Should generate a set of frame timestamps in five-minute intervals', () => {
    const timestamps = generateRadarFrameTimestamps(6, new Date('2020-07-17T16:15:00.100Z'))
    expect(timestamps).to.deep.equal([
      '2020-07-17T15:50:00.000Z',
      '2020-07-17T15:55:00.000Z',
      '2020-07-17T16:00:00.000Z',
      '2020-07-17T16:05:00.000Z',
      '2020-07-17T16:10:00.000Z',
      '2020-07-17T16:15:00.000Z'
    ])
  })

  it('Should generate axios wms request config for a specified radar frame', () => {
    const config = wmsRequestForRadar('2020-07-17T16:20:00.000Z')
    expect(config).to.deep.equal({
      url: 'https://openwms.fmi.fi/geoserver/Radar/wms',
      responseType: 'arraybuffer',
      timeout: 30000,
      params: {
        service: 'WMS',
        version: '1.3',
        request: 'GetMap',
        format: 'image/png',
        bbox: '-118331.366408,6335621.167014,875567.731907,7907751.537264',
        srs: 'EPSG:3067',
        width: 1987,
        height: 3144,
        layers: 'Radar:suomi_rr_eureffin',
        time: '2020-07-17T16:20:00.000Z'
      }
    })
  })

  it('Should generate axios wms request config for a specified radar estimate frame', () => {
    const config = wmsRequestForRadarEstimate('2020-07-17T16:20:00.000Z')
    expect(config).to.deep.equal({
      url: 'https://openwms.fmi.fi/geoserver/Radar/wms',
      responseType: 'arraybuffer',
      timeout: 30000,
      params: {
        service: 'WMS',
        version: '1.3',
        request: 'GetMap',
        format: 'image/png',
        bbox: '-118331.366408,6335621.167014,875567.731907,7907751.537264',
        srs: 'EPSG:3067',
        width: 1987,
        height: 3144,
        layers: 'Radar:suomi_tuliset_rr_eureffin',
        time: '2020-07-17T16:20:00.000Z'
      }
    })
  })
})
