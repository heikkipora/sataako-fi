import fs from 'fs'
import os from 'os'
import path from 'path'
import {expect} from 'chai'
import {fetchPostProcessedRadarFrame} from '../src/fmi-radar-images.ts'
import {generateRadarFrameTimestamps, wmsRequestForRadar} from '../src/fmi-radar-frames.ts'

describe('FMI rain radar image fetcher', () => {
  let tmpFolder: string | null = null

  before(async() => {
    tmpFolder = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'sataako-test-'))
  })

  it('Should fetch radar image with WMS and postprocess it to PNG and WEBP files', async() => {
    const [oldestTimestamp] = generateRadarFrameTimestamps(3)
    const config = wmsRequestForRadar(oldestTimestamp)

    const filename = path.join(tmpFolder!, oldestTimestamp)
    await fetchPostProcessedRadarFrame(config, filename)
    expect((await fs.promises.stat(`${filename}.png`)).size).to.be.above(0)
    expect((await fs.promises.stat(`${filename}.webp`)).size).to.be.above(0)
  })
})
