import _ from 'lodash'
import $ from 'jquery'
import dateFns from 'date-fns'
import InfoPanel from './info-panel'
import React from 'react'
import ReactDOM from 'react-dom'
import {createMap, panTo, showRadarFrame} from './map'

const FRAME_DELAY_MS = 500
const FRAME_LOOP_DELAY_MS = 5000

const defaultSettings = {
  lat: Number(localStorage.getItem('sataako-fi-lat')) || 60.17297214455122,
  lon: Number(localStorage.getItem('sataako-fi-lng')) || 24.93999467670711,
  zoom: Number(localStorage.getItem('sataako-fi-zoom')) || 7
}

const SataakoApp = React.createClass({
  getInitialState() {
    return {
      currentFrame: null,
      currentFrameIndex: 0,
      frames: []
    }
  },
  componentDidMount() {
    this.map = createMap(defaultSettings)
    this.reloadFramesList()
    this.animateRadar()
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.onLocation)
    }
  },
  render() {
    const radarFrameTimestamp = this.state.currentFrame ? dateFns.format(this.state.currentFrame.timestamp, 'D.M. HH:mm') : ''

    return (
      <div>
        <div id="map"></div>
        <div id="preload-frames">{this.renderFrameImages()}</div>
        <div className="radar-timestamp"><span>{radarFrameTimestamp}</span></div>
        <InfoPanel/>
      </div>
    )
  },
  renderFrameImages() {
    return this.state.frames.map(frame => <img key={frame.image} src={frame.image}/>)
  },
  reloadFramesList() {
    $.get('/frames.json', frames =>this.setState({frames}))
    window.setTimeout(this.reloadFramesList, 60 * 1000)
  },
  animateRadar() {
    let delayMs = FRAME_DELAY_MS

    if (this.state.frames.length > 0) {
      if (this.state.currentFrameIndex >= this.state.frames.length) {
        this.setState({currentFrameIndex: 0})
        delayMs = FRAME_LOOP_DELAY_MS
      } else {
        const currentFrame = this.state.frames[this.state.currentFrameIndex];
        showRadarFrame(this.map, currentFrame.image)
        this.setState({currentFrame, currentFrameIndex: this.state.currentFrameIndex + 1})
      }
    }

    window.setTimeout(this.animateRadar, delayMs)
  },
  onLocation(geolocationResponse) {
    panTo(this.map, [geolocationResponse.coords.longitude, geolocationResponse.coords.latitude])
  }
})

ReactDOM.render(<SataakoApp />, document.getElementById('app'))
