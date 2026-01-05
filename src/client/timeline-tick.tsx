import classNames from 'classnames'
import {format, parseISO} from 'date-fns'
import React from 'react'

export function TimelineTick({isCurrent, isForecast, running, timestamp, onResume, onSelect}: {isCurrent: boolean, isForecast?: boolean, running: boolean, timestamp: string, onResume: () => void, onSelect: (timestamp: string) => void}) {
  const formattedTimestamp = format(parseISO(timestamp), 'HH:mm')
  const isQuarterHour = formattedTimestamp.endsWith(':00') || formattedTimestamp.endsWith(':15') || formattedTimestamp.endsWith(':30') || formattedTimestamp.endsWith(':45')
  const className = classNames(
    'timeline__tick',
    {'timeline__tick--large': isQuarterHour},
    {'timeline__tick--small': !isQuarterHour},
    {'timeline__tick--selected': !running && isCurrent}
  )

  const handleMouseDown = () => onSelect(timestamp)
  const handleMouseEnter = (event: React.MouseEvent) => {
    if (event.buttons === 1) {
      onSelect(timestamp)
    }
  }

  return <div className={className} onMouseDown={handleMouseDown} onMouseUp={onResume} onMouseEnter={handleMouseEnter} key={timestamp} data-timestamp={timestamp}>
    {isCurrent && renderTooltip(formattedTimestamp, isForecast)}
  </div>
}

function renderTooltip(formattedTimestamp: string, isForecast?: boolean) {
  const className = classNames(
    'timeline__tooltip',
    {'timeline__tooltip--forecast': isForecast}
  )
  return <div className={className}>{formattedTimestamp}</div>
}
