import maplibregl from 'maplibre-gl'

export class DarkModeControl implements maplibregl.IControl {
  private container: HTMLElement | null = null
  private button: HTMLButtonElement | null = null
  private darkMode: boolean
  private onToggle: () => void

  constructor(darkMode: boolean, onToggle: () => void) {
    this.darkMode = darkMode
    this.onToggle = onToggle
  }

  onAdd() {
    this.container = document.createElement('div')
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group'

    this.button = document.createElement('button')
    this.button.type = 'button'
    this.button.className = 'dark-mode-ctrl'
    this.button.innerHTML = this.darkMode ? sunIcon : moonIcon
    this.button.addEventListener('click', this.onToggle)

    this.container.appendChild(this.button)
    return this.container
  }

  onRemove() {
    this.container?.remove()
    this.container = null
    this.button = null
  }

  update(darkMode: boolean) {
    this.darkMode = darkMode
    if (this.button) {
      this.button.innerHTML = darkMode ? sunIcon : moonIcon
    }
  }
}

const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
