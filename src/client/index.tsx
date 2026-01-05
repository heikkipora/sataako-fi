import axios from 'axios'
import classNames from 'classnames'
import {collapsedInitial, mapSettings, overrideParams, storeCollapsed, storeMapSettings} from './settings'
import {createMap, panTo, showRadarFrame} from './map'
import {createRoot} from 'react-dom/client'
import {Frame} from './types'
import {InfoPanel} from './info-panel'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Timeline} from './timeline'

const FRAME_DELAY_MS = 500
const FRAME_LIST_RELOAD_MS = 30 * 1000

const map = createMap(mapSettings)
map.on('moveend', () => storeMapSettings(map.getView().getCenter(), map.getView().getZoom()))

if (!overrideParams.x && !overrideParams.y && navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((position) => panTo(map, [position.coords.longitude, position.coords.latitude]))
}

function SataakoApp() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState<boolean>(collapsedInitial)
  const [currentTimestamp, setCurrentTimestamp] = useState<string|null>(null)
  const [frames, setFrames] = useState<Frame[]>([])
  const [running, setRunning] = useState<boolean>(true)

  useEffect(() => storeCollapsed(collapsed), [collapsed])
  useEffect(() => map.setTarget(mapRef.current ?? undefined), [])

  useEffect(() => {
    async function loadFramesList() {
      const {data}: {data: Frame[]} = await axios.get('/frames.json')
      setFrames(data)
    }
    loadFramesList()
    const timer = setInterval(loadFramesList, FRAME_LIST_RELOAD_MS)
    return () => clearInterval(timer)
  }, [])

  const currentFrame = frames.find(frame => frame.timestamp === currentTimestamp)
  const frameDelay = getFrameDelay(currentFrame, frames)

  useEffect(() => {
    function animateRadar() {
      setCurrentTimestamp(nextTimestamp(currentTimestamp, frames))
    }
    if (!running) {
      return undefined
    }
    const timer = setTimeout(animateRadar, frameDelay)
    return () => clearTimeout(timer)
  }, [running, currentTimestamp, frameDelay, frames])

  useEffect(() => {
    if (currentFrame) {
      showRadarFrame(map, currentFrame)
    }
  }, [currentFrame])

  const onTimelineResume = useCallback(() => setRunning(true), [])
  const onTimelineSelect = useCallback((value: string) => {
    setRunning(false)
    setCurrentTimestamp(value)
  }, [])
  const onInfoPanelToggle = useCallback(() => setCollapsed(!collapsed), [collapsed])

  const className = classNames({'app--infopanel-expanded': !collapsed})
  return <div className={className} style={{height: window.innerHeight}}>
    <div id="map" ref={mapRef}></div>
    <InfoPanel collapsed={collapsed} onInfoPanelToggle={onInfoPanelToggle}/>
    <Timeline timestamps={frames} currentTimestamp={currentTimestamp} running={running} onResume={onTimelineResume} onSelect={onTimelineSelect}/>
  </div>
}

function getFrameDelay(currentFrame: Frame | undefined, frames: Frame[]): number {
  if (!currentFrame) {
    return FRAME_DELAY_MS
  }

  const isLastOfList = frames[frames.length - 1] === currentFrame
  if (isLastOfList) {
    return 5 * FRAME_DELAY_MS
  }

  if (currentFrame.isForecast) {
    return 3 * FRAME_DELAY_MS
  }

  return FRAME_DELAY_MS
}

function nextTimestamp(currentTimestamp: string | null, frames: Frame[]) {
  if (!currentTimestamp) {
    return newestNonForecastTimestamp(frames)
  }

  const index = frames.findIndex(frame => frame.timestamp === currentTimestamp)
  if (index === -1) {
    return newestNonForecastTimestamp(frames)
  }
  if (index === frames.length - 1) {
    return frames[0].timestamp
  }
  return frames[index + 1].timestamp
}

function newestNonForecastTimestamp(frames: Frame[]) {
  return frames.filter(frame => !frame.isForecast).pop()?.timestamp || null
}

const root = createRoot(document.getElementById('app')!)
root.render(<SataakoApp/>);
