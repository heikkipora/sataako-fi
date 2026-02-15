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
    this.button.textContent = this.darkMode ? '\u2600' : '\u263E'
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
      this.button.textContent = darkMode ? '\u2600' : '\u263E'
    }
  }
}
