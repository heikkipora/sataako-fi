import axios from 'axios'
import classNames from 'classnames'
import {InfoPanel} from './info-panel'
import React from 'react'
import ReactDOM from 'react-dom'
import {Timeline} from './timeline'
import {createMap, panTo, showRadarFrame} from './map'
import {Frame, MapSettings} from './types'
import Map from 'ol/Map'

const FRAME_DELAY_MS = 500
const FRAME_LIST_RELOAD_MS = 30 * 1000

interface SataakoAppState {
  currentTimestamp: string | null
  running: boolean
  frames: Frame[]
  mapSettings: MapSettings
  collapsed: boolean
}

class SataakoApp extends React.Component<{}, SataakoAppState> {
  public skipUpdate: number
  public onResizeHandler: () => void
  public map?: Map
  public loadFramesInterval?: number
  public animateRadarInterval?: number

  constructor(props: {}) {
    super(props)
    const params = this.parseQueryString()
    this.skipUpdate = 0
    this.state = {
      currentTimestamp: null,
      running: true,
      frames: [],
      mapSettings: {
        x: Number(params.x || localStorage.getItem('sataako-fi-x')) || 2776307.5078,
        y: Number(params.y || localStorage.getItem('sataako-fi-y')) || 8438349.32742,
        zoom: Number(params.zoom || localStorage.getItem('sataako-fi-zoom')) || 7
      },
      collapsed: (params.collapsed || localStorage.getItem('sataako-fi-collapsed-v2')) === 'true'
    }
    this.onResizeHandler = this.onResize.bind(this)
  }

  componentDidMount() {
    this.map = createMap(this.state.mapSettings)
    this.map.on('moveend', this.onMapMove.bind(this, null))

    this.loadFramesList()
    this.loadFramesInterval = setInterval(this.loadFramesList.bind(this, null), FRAME_LIST_RELOAD_MS) as unknown as number
    this.animateRadarInterval = setInterval(this.animateRadar.bind(this, null), FRAME_DELAY_MS) as unknown as number
    window.addEventListener('resize', this.onResizeHandler)

    const params = this.parseQueryString()
    if (!params.x && !params.y && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.onLocation.bind(this))
    }
  }

  componentDidUpdate(_: unknown, prevState: SataakoAppState) {
    if (this.map && this.state.currentTimestamp !== prevState.currentTimestamp) {
      const currentFrame = this.state.frames.find(frame => frame.timestamp === this.state.currentTimestamp)
      if (currentFrame) {
        this.setSkipUpdate(this.state.frames, currentFrame)
        showRadarFrame(this.map, currentFrame)
      }
    }
    if (this.state.collapsed !== prevState.collapsed) {
      localStorage.setItem('sataako-fi-collapsed-v2', String(this.state.collapsed))
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResizeHandler)
    clearInterval(this.animateRadarInterval)
    clearInterval(this.loadFramesInterval)
  }

  render() {
    const className = classNames({'app--infopanel-expanded': !this.state.collapsed})
    return <div className={className} style={{height: window.innerHeight}}>
        <div id="map"></div>
        <InfoPanel collapsed={this.state.collapsed} onInfoPanelToggle={this.onInfoPanelToggle.bind(this)}/>
        {this.state.currentTimestamp && <Timeline
          timestamps={this.state.frames}
          currentTimestamp={this.state.currentTimestamp}
          running={this.state.running}
          onResume={this.onTimelineResume.bind(this)}
          onSelect={this.onTimelineSelect.bind(this)}
        />}
      </div>
  }

  loadFramesList() {
    axios.get('/frames.json').then(response => {
      const frames = response.data as Frame[]
      this.setState(prevState => (
        {frames, currentTimestamp: this.currentTimestampDefault(prevState, frames)}
      ))
    })
  }

  currentTimestampDefault(state: SataakoAppState, frames: Frame[]) {
    if (!state.currentTimestamp) {
      return this.newestNonForecastTimestamp(frames)
    }

    const index = frames.findIndex(frame => frame.timestamp === state.currentTimestamp)
    if (index === -1) {
      return frames[0].timestamp
    }
    return state.currentTimestamp
  }

  nextTimestamp(state: SataakoAppState) {
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

  newestNonForecastTimestamp(frames: Frame[]) {
    return frames.filter(frame => !frame.isForecast).pop()?.timestamp || null
  }

  animateRadar() {
    if (!this.state.running || !this.state.currentTimestamp) {
      return
    }
    if (this.skipUpdate > 0) {
      this.skipUpdate -= 1
    } else {
      this.setState(prevState => ({currentTimestamp: this.nextTimestamp(prevState)}))
    }
  }

  setSkipUpdate(frames: Frame[], currentFrame: Frame) {
    const isLastOfList = frames[frames.length - 1] === currentFrame
    if (isLastOfList) {
      this.skipUpdate = 4
    } else if (currentFrame.isForecast) {
      this.skipUpdate = 2
    } else {
      this.skipUpdate = 0
    }
  }

  parseQueryString = () => {
    const parsed = document.location.search
      .slice(1)
      .split('&')
      .filter(p => p)
      .reduce((acc, parameter) => {
        const [key, value] = parameter.split('=')
        return {
          ...acc,
          [key]: decodeURIComponent(value)
        }
      }, {})

    const {collapsed, x, y, zoom}: {collapsed?: string, x?: string, y?: string, zoom?: string} = parsed
    return {collapsed, x, y, zoom}
  }

  onLocation(geolocationResponse: GeolocationPosition) {
    if (this.map) {
      panTo(this.map, [geolocationResponse.coords.longitude, geolocationResponse.coords.latitude])
    }
  }

  onMapMove() {
    const view = this.map?.getView()
    const center = view?.getCenter()
    if (!view || !center) {
      return
    }

    const [x, y] = center
    localStorage.setItem('sataako-fi-x', String(x))
    localStorage.setItem('sataako-fi-y', String(y))
    localStorage.setItem('sataako-fi-zoom', String(view.getZoom()))
  }

  onTimelineSelect(timestamp: string) {
    this.setState({currentTimestamp: timestamp, running: false})
  }

  onTimelineResume() {
    this.setState({running: true})
  }

  onInfoPanelToggle() {
    this.setState(prevState => ({collapsed: !prevState.collapsed}))
  }

  onResize() {
    this.forceUpdate(() => this.map?.updateSize())
  }
}

ReactDOM.render(<SataakoApp/>, document.getElementById('app'))
