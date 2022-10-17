import classNames from 'classnames'
import {format, parseISO} from 'date-fns'
import React, {useCallback} from 'react'

export function TimelineTick({isCurrent, isForecast, running, timestamp, onResume, onSelect}: {isCurrent: boolean, isForecast?: boolean, running: boolean, timestamp: string, onResume: () => void, onSelect: (timestamp: string) => void}) {
  const formattedTimestamp = format(parseISO(timestamp), 'HH:mm')
  const quarter = isQuarter(formattedTimestamp)
  const className = classNames(
    'timeline__tick',
    {'timeline__tick--large': quarter},
    {'timeline__tick--small': !quarter},
    {'timeline__tick--selected': !running && isCurrent}
  )
  const onSelectHandler = useCallback(() => onSelect(timestamp), [timestamp, onSelect])
  const onEnterHandler = useCallback((event: React.MouseEvent) => {
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
