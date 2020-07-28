import axios from 'axios'
import InfoPanel from './info-panel'
import React from 'react'
import ReactDOM from 'react-dom'
import {Timeline} from './timeline'
import {createMap, panTo, showRadarFrame} from './map'

const FRAME_DELAY_MS = 500
const FRAME_LIST_RELOAD_MS = 30 * 1000

class SataakoApp extends React.Component {
  constructor() {
    super()
    this.state = {
      currentTimestamp: null,
      running: false,
      frames: [],
      mapSettings: {
        x: Number(localStorage.getItem('sataako-fi-x')) || 2776307.5078,
        y: Number(localStorage.getItem('sataako-fi-y')) || 8438349.32742,
        zoom: Number(localStorage.getItem('sataako-fi-zoom')) || 7
      }
    }
  }

  componentDidMount() {
    this.map = createMap(this.state.mapSettings)
    this.map.on('moveend', this.onMapMove.bind(this, null))

    this.loadFramesList()
    this.loadFramesInterval = setInterval(this.loadFramesList.bind(this, null), FRAME_LIST_RELOAD_MS)
    this.animateRadarInterval = setInterval(this.animateRadar.bind(this, null), FRAME_DELAY_MS)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.onLocation.bind(this))
    }
  }

  componentDidUpdate(_, prevState) {
    if (this.state.currentTimestamp !== prevState.currentTimestamp) {
      const currentFrame = this.state.frames.find(frame => frame.timestamp === this.state.currentTimestamp)
      showRadarFrame(this.map, currentFrame)
    }
  }

  componentWillUnmount() {
    clearInterval(this.animateRadarInterval)
    clearInterval(this.loadFramesInterval)
  }

  render() {
    return (
      <div>
        <div id="map"></div>
        <InfoPanel/>
        {this.state.currentTimestamp && <Timeline
          timestamps={this.state.frames}
          currentTimestamp={this.state.currentTimestamp}
          running={this.state.running}
          onToggle={this.onTimelineToggleRunning.bind(this)}
          onSelect={this.onTimelineSelect.bind(this)}
        />}
      </div>
    )
  }

  loadFramesList() {
    axios.get('/frames.json').then(response => {
      const frames = response.data
      this.setState(prevState => (
        {frames, currentTimestamp: this.currentTimestampDefault(prevState, frames)}
      ))
    })
  }

  currentTimestampDefault(state, frames) {
    if (!state.currentTimestamp) {
      return this.newestNonForecastTimestamp(frames)
    }

    const index = frames.findIndex(frame => frame.timestamp === state.currentTimestamp)
    if (index === -1) {
      return frames[0].timestamp
    }
    return state.currentTimestamp
  }

  nextTimestamp(state) {
    if (!state.currentTimestamp) {
      return this.newestNonForecastTimestamp(state.frames)
    }

    const index = state.frames.findIndex(frame => frame.timestamp === state.currentTimestamp)
    if (index === -1) {
      return this.newestNonForecastTimestamp(state.frames)
    }
    if (index === state.frames.length - 1) {
      return state.frames[0].timestamp
    }
    return state.frames[index + 1].timestamp
  }

  newestNonForecastTimestamp(frames) {
    return frames.filter(frame => !frame.isForecast).pop().timestamp
  }

  animateRadar() {
    if (!this.state.running || !this.state.currentTimestamp) {
      return
    }
    this.setState(prevState => ({currentTimestamp: this.nextTimestamp(prevState)}))
  }

  onLocation(geolocationResponse) {
    panTo(this.map, [geolocationResponse.coords.longitude, geolocationResponse.coords.latitude])
  }

  onMapMove() {
    const [x, y] = this.map.getView().getCenter()
    const zoom = this.map.getView().getZoom()

    localStorage.setItem('sataako-fi-x', x)
    localStorage.setItem('sataako-fi-y', y)
    localStorage.setItem('sataako-fi-zoom', zoom)
  }

  onTimelineSelect(timestamp) {
    this.setState({currentTimestamp: timestamp, running: false})
  }

  onTimelineToggleRunning(running) {
    this.setState({running})
  }
}

ReactDOM.render(<SataakoApp />, document.getElementById('app'))
