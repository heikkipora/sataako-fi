import React from 'react'
import {TimelineTick} from './timeline-tick'
import type {Frame} from './types'

export function Timeline({currentTimestamp, running, timestamps, onResume, onSelect}: {currentTimestamp: string | null, running: boolean, timestamps: Frame[], onResume: () => void, onSelect: (timestamp: string) => void}) {
  if (!currentTimestamp) {
    return null
  }

  const handleTouch = (event: React.TouchEvent) => {
    event.preventDefault()
    if (event.touches.length === 0) {
      return
    }

    const {clientX, clientY} = event.touches.item(0)
    const element = document.elementFromPoint(clientX, clientY)
    if (element instanceof HTMLElement) {
      const {timestamp} = element.dataset
      if (timestamp) {
        onSelect(timestamp)
      }
    }
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    event.preventDefault()
    onResume()
  }

  return <div className="timeline" onTouchStart={handleTouch} onTouchMove={handleTouch} onTouchEnd={handleTouchEnd}>
    {timestamps.map(({timestamp}) => <TimelineTick key={timestamp} timestamp={timestamp} isCurrent={timestamp === currentTimestamp} running={running} onResume={onResume} onSelect={onSelect}/>)}
  </div>
}
