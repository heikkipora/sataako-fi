import {Frame} from './types'
import React, {useCallback} from 'react'
import {TimelineTick} from './timeline-tick'

export function Timeline({currentTimestamp, running, timestamps, onResume, onSelect}: {currentTimestamp: string | null, running: boolean, timestamps: Frame[], onResume: () => void, onSelect: (timestamp: string) => void}) {
  const touchHandler = useCallback((event: React.TouchEvent) => onTouch(onSelect, event), [onSelect])
  const touchEndHandler = useCallback((event: React.TouchEvent) => onTouchEnd(onResume, event), [onResume])

  if (!currentTimestamp) {
    return null
  }

  return <div className="timeline" onTouchStart={touchHandler} onTouchMove={touchHandler} onTouchEnd={touchEndHandler}>
    {timestamps.map(({timestamp, isForecast}) => <TimelineTick key={timestamp} timestamp={timestamp} isCurrent={timestamp === currentTimestamp} isForecast={isForecast} running={running} onResume={onResume} onSelect={onSelect}/>)}
  </div>
}

function onTouch(onSelect: (timestamp: string) => void, event: React.TouchEvent) {
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

function onTouchEnd(onResume: () => void, event: React.TouchEvent) {
  event.preventDefault()
  onResume()
}
