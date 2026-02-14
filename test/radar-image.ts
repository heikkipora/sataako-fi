import fs from 'fs'
import os from 'os'
import path from 'path'
import {describe, it, before} from 'node:test'
import assert from 'node:assert/strict'
import {fetchPostProcessedRadarFrame} from '../src/fmi-radar-images.ts'
import {generateRadarFrameTimestamps, wmsRequestForRadar} from '../src/fmi-radar-frames.ts'

describe('FMI rain radar image fetcher', () => {
  let tmpFolder: string | null = null

  before(async() => {
    tmpFolder = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'sataako-test-'))
  })

  it('Should fetch radar image with WMS and postprocess it to a WEBP file', async() => {
    const [oldestTimestamp] = generateRadarFrameTimestamps(3)
    const config = wmsRequestForRadar(oldestTimestamp)

    const filename = path.join(tmpFolder!, oldestTimestamp)
    await fetchPostProcessedRadarFrame(config, filename)
    assert.ok((await fs.promises.stat(`${filename}.webp`)).size > 0)
  })
})
