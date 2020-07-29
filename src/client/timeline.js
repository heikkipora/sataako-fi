import classNames from 'classnames'
import {format, parseISO} from 'date-fns'
import PropTypes from 'prop-types'
import React from 'react'

export class Timeline extends React.PureComponent {
  constructor(props) {
    super(props)
    this.timelineRef = React.createRef()
    this.onTouchHandler = this.onTouch.bind(this)
  }

  componentDidMount() {
    this.timelineRef.current.addEventListener('touchstart', this.onTouchHandler)
    this.timelineRef.current.addEventListener('touchmove', this.onTouchHandler)
    this.timelineRef.current.addEventListener('touchend', this.onTouchHandler)
  }

  componentWillUnmount() {
    this.timelineRef.current.removeEventListener('touchstart', this.onTouchHandler)
    this.timelineRef.current.removeEventListener('touchmove', this.onTouchHandler)
    this.timelineRef.current.removeEventListener('touchend', this.onTouchHandler)
  }

  render() {
    const {timestamps, currentTimestamp} = this.props
    return <div className="timeline" ref={this.timelineRef}>
      {this.renderTicks(timestamps, currentTimestamp)}
    </div>
  }

  renderTicks(timestamps, currentTimestamp) {
    return timestamps.map(t =>
      this.renderTick(t, t.timestamp === currentTimestamp)
    )
  }

  renderTick({timestamp, isForecast}, isCurrent) {
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

  onMouseEnter(timestamp, event) {
    const leftPressed = event.buttons === undefined ? event.which === 1 : event.buttons === 1
    if (leftPressed) {
      this.props.onSelect(timestamp)
    }
  }

  onTouch(event) {
    event.preventDefault()
    if (event.type === 'touchend') {
      this.props.onResume()
      return
    }
    const {clientX, clientY} = event.touches && event.touches.length > 0 ? event.touches[0] : event
    if (clientX && clientY) {
      const element = document.elementFromPoint(clientX, clientY)
      const {timestamp} = element.dataset
      if (timestamp) {
        this.props.onSelect(timestamp)
      }
    }
  }

  renderTooltip = (formattedTimestamp, isForecast) => {
    const className = classNames(
      'timeline__tooltip',
      {'timeline__tooltip--forecast': isForecast}
    )
    return <div className={className}>{formattedTimestamp}</div>
  }

  formatTimestamp = timestamp => format(parseISO(timestamp), 'HH:mm')

  isQuarter = formattedTimestamp => {
    const [, minutes] = formattedTimestamp.split(':')
    return ['00', '15', '30', '45'].includes(minutes)
  }
}

Timeline.propTypes = {
  currentTimestamp: PropTypes.string.isRequired,
  running: PropTypes.bool.isRequired,
  timestamps: PropTypes.array.isRequired,
  onResume: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired
}
