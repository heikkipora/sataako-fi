import classNames from 'classnames'
import {format, parseISO} from 'date-fns'
import {Frame} from './types'
import React, {useCallback} from 'react'

export function Timeline({currentTimestamp, running, timestamps, onResume, onSelect}: {currentTimestamp: string, running: boolean, timestamps: Frame[], onResume: () => void, onSelect: (timestamp: string) => void}) {
  const touchHandler = useCallback(event => onTouch(onSelect, event), [onSelect])
  const touchEndHandler = useCallback(event => onTouchEnd(onResume, event), [onResume])

  return <div className="timeline" onTouchStart={touchHandler} onTouchMove={touchHandler} onTouchEnd={touchEndHandler}>
    {timestamps.map(({timestamp, isForecast}) => <Tick key={timestamp} timestamp={timestamp} isCurrent={timestamp === currentTimestamp} isForecast={isForecast} running={running} onResume={onResume} onSelect={onSelect}/>)}
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

function Tick({isCurrent, isForecast, running, timestamp, onResume, onSelect}: {isCurrent: boolean, isForecast?: boolean, running: boolean, timestamp: string, onResume: () => void, onSelect: (timestamp: string) => void}) {
  const formattedTimestamp = format(parseISO(timestamp), 'HH:mm')
  const quarter = isQuarter(formattedTimestamp)
  const className = classNames(
    'timeline__tick',
    {'timeline__tick--large': quarter},
    {'timeline__tick--small': !quarter},
    {'timeline__tick--selected': !running && isCurrent}
  )
  const onSelectHandler = useCallback(() => onSelect(timestamp), [timestamp, onSelect])
  const onEnterHandler = useCallback(event => {
    const leftPressed = event.buttons === 1
    if (leftPressed) {
      onSelect(timestamp)
    }
  }, [timestamp, onSelect])

  return <div className={className} onMouseDown={onSelectHandler} onMouseUp={onResume} onMouseEnter={onEnterHandler} key={timestamp} data-timestamp={timestamp}>
    {isCurrent && renderTooltip(formattedTimestamp, isForecast)}
  </div>
}

function isQuarter(formattedTimestamp: string) {
  const [, minutes] = formattedTimestamp.split(':')
  return ['00', '15', '30', '45'].includes(minutes)
}

function renderTooltip(formattedTimestamp: string, isForecast?: boolean) {
  const className = classNames(
    'timeline__tooltip',
    {'timeline__tooltip--forecast': isForecast}
  )
  return <div className={className}>{formattedTimestamp}</div>
}
