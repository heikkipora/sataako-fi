import {describe, it} from 'node:test'
import assert from 'node:assert/strict'
import {generateRadarFrameTimestamps, wmsRequestForRadar} from '../src/fmi-radar-frames.ts'

describe('FMI rain radar wms request generator', () => {
  it('Should generate a set of frame timestamps in five-minute intervals', () => {
    const timestamps = generateRadarFrameTimestamps(6, new Date('2020-07-17T16:15:00.100Z').getTime())
    assert.deepStrictEqual(timestamps, [
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
    assert.deepStrictEqual(config, {
      url: 'https://openwms.fmi.fi/geoserver/Radar/wms',
      responseType: 'arraybuffer',
      timeout: 30000,
      params: {
        service: 'WMS',
        version: '1.1.1',
        request: 'GetMap',
        format: 'image/png',
        bbox: '1137189.3964862407,7709459.565190111,4160194.0259960056,11485434.685198486',
        srs: 'EPSG:3857',
        width: 2236,
        height: 2793,
        layers: 'Radar:suomi_rr_eureffin',
        time: '2020-07-17T16:20:00.000Z'
      }
    })
  })
})
