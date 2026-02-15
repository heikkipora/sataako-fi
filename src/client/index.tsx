import axios from 'axios'
import classNames from 'classnames'
import maplibregl from 'maplibre-gl'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {collapsedInitial, darkModeInitial, mapSettings, overrideParams, storeCollapsed, storeDarkMode, storeMapSettings} from './settings'
import {createMap, panTo, setMapStyle, showRadarFrame} from './map'
import {createRoot} from 'react-dom/client'
import {InfoPanel} from './info-panel'
import {Timeline} from './timeline'
import type {Frame} from './types'

const FRAME_DELAY_MS = 500
const FRAME_LIST_RELOAD_MS = 30 * 1000

function SataakoApp() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const darkModeInitialRef = useRef(true)
  const [collapsed, setCollapsed] = useState<boolean>(collapsedInitial)
  const [darkMode, setDarkMode] = useState<boolean>(darkModeInitial)
  const [currentTimestamp, setCurrentTimestamp] = useState<string|null>(null)
  const [frames, setFrames] = useState<Frame[]>([])
  const [running, setRunning] = useState<boolean>(true)

  const onDarkModeToggle = useCallback(() => setDarkMode(d => !d), [])

  useEffect(() => storeCollapsed(collapsed), [collapsed])
  useEffect(() => storeDarkMode(darkMode), [darkMode])

  useEffect(() => {
    if (!mapRef.current) return
    const map = createMap('map', mapSettings, darkModeInitial, onDarkModeToggle)
    mapInstanceRef.current = map

    map.on('moveend', () => storeMapSettings(map.getCenter(), map.getZoom()))

    if (!overrideParams.lng && !overrideParams.lat && navigator.geolocation && document.visibilityState !== 'hidden') {
      navigator.geolocation.getCurrentPosition((position) => panTo(map, [position.coords.longitude, position.coords.latitude]))
    }

    return () => { map.remove() }
  }, [onDarkModeToggle])

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
    if (currentFrame && mapInstanceRef.current) {
      showRadarFrame(mapInstanceRef.current, currentFrame)
    }
  }, [currentFrame])

  useEffect(() => {
    if (darkModeInitialRef.current) {
      darkModeInitialRef.current = false
      return
    }
    if (mapInstanceRef.current) {
      setMapStyle(mapInstanceRef.current, darkMode)
    }
  }, [darkMode])

  const onTimelineResume = useCallback(() => setRunning(true), [])
  const onTimelineSelect = useCallback((value: string) => {
    setRunning(false)
    setCurrentTimestamp(value)
  }, [])
  const onInfoPanelToggle = useCallback(() => setCollapsed(!collapsed), [collapsed])

  const className = classNames({'app--infopanel-expanded': !collapsed, 'dark': darkMode})
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

  return FRAME_DELAY_MS
}

function nextTimestamp(currentTimestamp: string | null, frames: Frame[]) {
  if (!currentTimestamp) {
    return newestTimestamp(frames)
  }

  const index = frames.findIndex(frame => frame.timestamp === currentTimestamp)
  if (index === -1) {
    return newestTimestamp(frames)
  }
  if (index === frames.length - 1) {
    return frames[0].timestamp
  }
  return frames[index + 1].timestamp
}

function newestTimestamp(frames: Frame[]) {
  return frames[frames.length - 1]?.timestamp || null
}

const root = createRoot(document.getElementById('app')!)
root.render(<SataakoApp/>);
