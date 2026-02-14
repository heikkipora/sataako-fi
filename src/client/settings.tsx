export const overrideParams = parseQueryString()

export const collapsedInitial = (overrideParams.collapsed || localStorage.getItem('sataako-fi-collapsed-v2')) === 'true'

export const darkModeInitial = (overrideParams.darkmode || localStorage.getItem('sataako-fi-dark-mode')) === 'true'

function readCoordinate(override: string | undefined, key: string): number | undefined {
  const value = Number(override || localStorage.getItem(key))
  if (!value || Math.abs(value) > 180) return undefined
  return value
}

export const mapSettings = {
  lng: readCoordinate(overrideParams.lng, 'sataako-fi-lng') ?? 24.94,
  lat: readCoordinate(overrideParams.lat, 'sataako-fi-lat') ?? 60.17,
  zoom: Number(overrideParams.zoom || localStorage.getItem('sataako-fi-zoom')) || 7
}

export function storeMapSettings(center: {lng: number, lat: number}, zoom: number) {
  localStorage.setItem('sataako-fi-lng', String(center.lng))
  localStorage.setItem('sataako-fi-lat', String(center.lat))
  localStorage.setItem('sataako-fi-zoom', String(zoom))
}

export function storeCollapsed(collapsed: boolean) {
  localStorage.setItem('sataako-fi-collapsed-v2', String(collapsed))
}

export function storeDarkMode(dark: boolean) {
  localStorage.setItem('sataako-fi-dark-mode', String(dark))
}

function parseQueryString(): {collapsed?: string, lng?: string, lat?: string, zoom?: string, darkmode?: string} {
  const params = new URLSearchParams(document.location.search)
  return {
    collapsed: params.get('collapsed') ?? undefined,
    lng: params.get('lng') ?? params.get('x') ?? undefined,
    lat: params.get('lat') ?? params.get('y') ?? undefined,
    zoom: params.get('zoom') ?? undefined,
    darkmode: params.get('darkmode') ?? undefined
  }
}
