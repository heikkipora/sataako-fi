import axios from 'axios'
import InfoPanel from './info-panel'
import React from 'react'
import ReactDOM from 'react-dom'
import {Timeline} from './timeline'
import {createMap, panTo, showRadarFrame} from './map'

const FRAME_DELAY_MS = 500
const FRAME_LOOP_DELAY_MS = 5000
const FRAME_LIST_RELOAD_MS = 30 * 1000

class SataakoApp extends React.Component {
  constructor() {
    super()
    this.state = {
      currentFrame: null,
      currentFrameIndex: 0,
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

    this.reloadFramesList()
    this.animateRadar()
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.onLocation.bind(this))
    }
  }

  render() {
    return (
      <div>
        <div id="map"></div>
        <InfoPanel/>
        {this.state.currentFrame && <Timeline
          timestamps={this.state.frames}
          currentTimestamp={this.state.currentFrame.timestamp}
          running={true}
          onToggle={running => console.log(running)}
          onSelect={timestamp => console.log(timestamp)}
        />}
      </div>
    )
  }

  reloadFramesList() {
    axios.get('/frames.json').then(({data: frames}) => this.setState({frames}))
    window.setTimeout(this.reloadFramesList.bind(this, null), FRAME_LIST_RELOAD_MS)
  }

  animateRadar() {
    let delayMs = FRAME_DELAY_MS

    if (this.state.frames.length > 0) {
      if (this.state.currentFrameIndex >= this.state.frames.length) {
        this.setState({currentFrameIndex: 0})
        delayMs = FRAME_LOOP_DELAY_MS
      } else {
        const currentFrame = this.state.frames[this.state.currentFrameIndex];
        showRadarFrame(this.map, currentFrame)
        this.setState({currentFrame, currentFrameIndex: this.state.currentFrameIndex + 1})
      }
    }

    window.setTimeout(this.animateRadar.bind(this, null), delayMs)
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
}

ReactDOM.render(<SataakoApp />, document.getElementById('app'))
