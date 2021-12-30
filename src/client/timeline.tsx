import classNames from 'classnames'
import {format, parseISO} from 'date-fns'
import React from 'react'
import {Frame} from './types'

interface TimelineProps {
  currentTimestamp: string
  running: boolean
  timestamps: Frame[]
  onResume: () => void
  onSelect: (timestamp: string) => void
}

export class Timeline extends React.PureComponent<TimelineProps> {
  render() {
    const {timestamps, currentTimestamp} = this.props
    const touchHandler = this.onTouch.bind(this)
    const touchEndHandler = this.onTouchEnd.bind(this)
    return <div className="timeline" onTouchStart={touchHandler} onTouchMove={touchHandler} onTouchEnd={touchEndHandler}>
      {this.renderTicks(timestamps, currentTimestamp)}
    </div>
  }

  renderTicks(timestamps: Frame[], currentTimestamp: string) {
    return timestamps.map(t =>
      this.renderTick(t, t.timestamp === currentTimestamp)
    )
  }

  renderTick({timestamp, isForecast}: Frame, isCurrent: boolean) {
    const formattedTimestamp = this.formatTimestamp(timestamp)
    const quarter = this.isQuarter(formattedTimestamp)
    const className = classNames(
      'timeline__tick',
      {'timeline__tick--large': quarter},
      {'timeline__tick--small': !quarter},
      {'timeline__tick--selected': !this.props.running && isCurrent}
    )
    const onSelectHandler = this.props.onSelect.bind(null, timestamp)
    const onEnterHandler = this.onMouseEnter.bind(this, timestamp)
    return <div className={className} onMouseDown={onSelectHandler} onMouseUp={this.props.onResume} onMouseEnter={onEnterHandler} key={timestamp} data-timestamp={timestamp}>
      {isCurrent && this.renderTooltip(formattedTimestamp, isForecast)}
    </div>
  }

  onMouseEnter(timestamp: string, event: React.MouseEvent) {
    const leftPressed = event.buttons === 1
    if (leftPressed) {
      this.props.onSelect(timestamp)
    }
  }

  onTouch(event: React.TouchEvent) {
    event.preventDefault()
    if (event.touches.length === 0) {
      return
    }

    const {clientX, clientY} = event.touches.item(0)
    const element = document.elementFromPoint(clientX, clientY)
    if (element instanceof HTMLElement) {
      const {timestamp} = element.dataset
      if (timestamp) {
        this.props.onSelect(timestamp)
      }
    }
  }

  onTouchEnd(event: React.TouchEvent) {
    event.preventDefault()
    this.props.onResume()
  }

  renderTooltip = (formattedTimestamp: string, isForecast?: boolean) => {
    const className = classNames(
      'timeline__tooltip',
      {'timeline__tooltip--forecast': isForecast}
    )
    return <div className={className}>{formattedTimestamp}</div>
  }

  formatTimestamp = (timestamp: string) => format(parseISO(timestamp), 'HH:mm')

  isQuarter = (formattedTimestamp: string) => {
    const [, minutes] = formattedTimestamp.split(':')
    return ['00', '15', '30', '45'].includes(minutes)
  }
}
