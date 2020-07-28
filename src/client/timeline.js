import classNames from 'classnames'
import {format, parseISO} from 'date-fns'
import PropTypes from 'prop-types'
import React from 'react'

export class Timeline extends React.PureComponent {
  render() {
    const {timestamps, currentTimestamp, running} = this.props
    return <div className="timeline">
      {this.renderPlayPause(running)}
      {this.renderTicks(timestamps, currentTimestamp)}
    </div>
  }

  renderPlayPause(running) {
    const className = classNames(
      'timeline__toggle',
      {'timeline__toggle--pause': running},
      {'timeline__toggle--play': !running}
    )
    const onClickHandler = this.props.onToggle.bind(null, !running)
    return <div className={className} onClick={onClickHandler}></div>
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
      {'timeline__tick--small': !quarter}
    )
    const onClickHandler = this.props.onSelect.bind(null, timestamp)
    return <div className={className} onClick={onClickHandler} key={timestamp}>
      {isCurrent && this.renderTooltip(formattedTimestamp, isForecast)}
    </div>
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
  onToggle: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired
}

