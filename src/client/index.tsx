import axios from 'axios'
import classNames from 'classnames'
import {createMap, panTo, showRadarFrame} from './map'
import {Frame} from './types'
import {InfoPanel} from './info-panel'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import ReactDOM from 'react-dom'
import {Timeline} from './timeline'

const FRAME_DELAY_MS = 500
const FRAME_LIST_RELOAD_MS = 30 * 1000

const params = parseQueryString()
function parseQueryString() {
  const parsed = document.location.search
    .slice(1)
    .split('&')
    .filter(p => p)
    .reduce((acc, parameter) => {
      const [key, value] = parameter.split('=')
      return {
        ...acc,
        [key]: decodeURIComponent(value)
      }
    }, {})

  const {collapsed, x, y, zoom}: {collapsed?: string, x?: string, y?: string, zoom?: string} = parsed
  return {collapsed, x, y, zoom}
}

const collapsedInitial = (params.collapsed || localStorage.getItem('sataako-fi-collapsed-v2')) === 'true'
const mapSettings = {
  x: Number(params.x || localStorage.getItem('sataako-fi-x')) || 2776307.5078,
  y: Number(params.y || localStorage.getItem('sataako-fi-y')) || 8438349.32742,
  zoom: Number(params.zoom || localStorage.getItem('sataako-fi-zoom')) || 7
}

const map = createMap(mapSettings)

if (!params.x && !params.y && navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((position) => panTo(map, [position.coords.longitude, position.coords.latitude]))
}

map.on('moveend', () => {
  const center = map.getView().getCenter()
  if (!center) {
    return
  }

  const [x, y] = center
  localStorage.setItem('sataako-fi-x', String(x))
  localStorage.setItem('sataako-fi-y', String(y))
  localStorage.setItem('sataako-fi-zoom', String(map.getView().getZoom()))
})

// eslint-disable-next-line max-statements
function SataakoApp() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState<boolean>(collapsedInitial)
  const [currentTimestamp, setCurrentTimestamp] = useState<string|null>(null)
  const [frames, setFrames] = useState<Frame[]>([])
  const [running, setRunning] = useState<boolean>(true)
  const [frameDelay, setFrameDelay] = useState<number>(FRAME_DELAY_MS)

  useEffect(() => localStorage.setItem('sataako-fi-collapsed-v2', String(collapsed)), [collapsed])

  useEffect(() => map.setTarget(mapRef.current ?? undefined), [])

  useEffect(() => {
    async function loadFramesList() {
      const {data}: {data: Frame[]} = await axios.get('/frames.json')
      setFrames(data)
      setCurrentTimestamp(currentTimestampDefault(currentTimestamp, data))
    }
    loadFramesList()
    const timer = setInterval(loadFramesList, FRAME_LIST_RELOAD_MS)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    function animateRadar() {
      setCurrentTimestamp(nextTimestamp(currentTimestamp, frames))
    }
    if (!running || !currentTimestamp) {
      return undefined
    }
    const timer = setInterval(animateRadar, frameDelay)
    return () => clearInterval(timer)
  }, [running, currentTimestamp, frameDelay])

  useEffect(() => {
    const currentFrame = frames.find(frame => frame.timestamp === currentTimestamp)
    if (currentFrame) {
      showRadarFrame(map, currentFrame)
      const isLastOfList = frames[frames.length - 1] === currentFrame
      if (isLastOfList) {
        setFrameDelay(5 * FRAME_DELAY_MS)
      } else if (currentFrame.isForecast) {
        setFrameDelay(3 * FRAME_DELAY_MS)
      } else {
        setFrameDelay(FRAME_DELAY_MS)
      }
    }
  }, [currentTimestamp, frames])

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

function currentTimestampDefault(currentTimestamp: string | null, frames: Frame[]) {
  if (!currentTimestamp || frames.length === 0) {
    return newestNonForecastTimestamp(frames)
  }

  const index = frames.findIndex(frame => frame.timestamp === currentTimestamp)
  if (index === -1) {
    return frames[0].timestamp
  }
  return currentTimestamp
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

ReactDOM.render(<SataakoApp/>, document.getElementById('app'))
