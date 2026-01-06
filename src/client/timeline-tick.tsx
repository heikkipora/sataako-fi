import classNames from 'classnames'
import React from 'react'
import {format, parseISO} from 'date-fns'

export function TimelineTick({isCurrent, running, timestamp, onResume, onSelect}: {isCurrent: boolean, running: boolean, timestamp: string, onResume: () => void, onSelect: (timestamp: string) => void}) {
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
    {isCurrent && <div className="timeline__tooltip">{formattedTimestamp}</div>}
  </div>
}
