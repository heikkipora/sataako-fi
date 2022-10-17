export const overrideParams = parseQueryString()

export const collapsedInitial = (overrideParams.collapsed || localStorage.getItem('sataako-fi-collapsed-v2')) === 'true'

export const mapSettings = {
  x: Number(overrideParams.x || localStorage.getItem('sataako-fi-x')) || 2776307.5078,
  y: Number(overrideParams.y || localStorage.getItem('sataako-fi-y')) || 8438349.32742,
  zoom: Number(overrideParams.zoom || localStorage.getItem('sataako-fi-zoom')) || 7
}

export function storeMapSettings(center: number[] | undefined, zoom: number | undefined) {
  if (center && zoom) {
    localStorage.setItem('sataako-fi-x', String(center[0]))
    localStorage.setItem('sataako-fi-y', String(center[1]))
    localStorage.setItem('sataako-fi-zoom', String(zoom))
  }
}

export function storeCollapsed(collapsed: boolean) {
  localStorage.setItem('sataako-fi-collapsed-v2', String(collapsed))
}

function parseQueryString() {
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
