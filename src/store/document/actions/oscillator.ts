import { DocumentStoreInstance } from '..'

/**
 * Toggles the oscilloscope panel.
 */
export function toggleOscilloscope (this: DocumentStoreInstance) {
  if (this.isOscilloscopeOpen) {
    this.closeOscilloscope()
  } else {
    this.openOscilloscope()
  }
}

/**
 * Opens the oscilloscope panel.
 * This will resume monitoring any previously-monitored ports.
 */
export function openOscilloscope (this: DocumentStoreInstance) {
  this
    .monitoredPortIds
    .forEach(portId => this.monitorPort(portId))

  this.isOscilloscopeOpen = true
}

/**
 * Closes the oscilloscope panel.
 * This will pause monitoring all ports while closed to save computation.
 */
export function closeOscilloscope (this: DocumentStoreInstance) {
  if (!this.isOscilloscopeOpen) return

  this
    .monitoredPortIds
    .forEach(portId => this.unmonitorPort(portId, false))

  this.oscillator.clear()
  this.isOscilloscopeOpen = false
}

export function destroyOscilloscope (this: DocumentStoreInstance) {
  const dialogResult = window
    .api
    .showMessageBox({
      message: 'Are you sure you want to remove all waves from the oscilloscope?',
      title: 'Confirm',
      buttons: ['Yes', 'No']
    })

  if (dialogResult === 0) {
    this
      .monitoredPortIds
      .forEach(portId => this.unmonitorPort(portId))

    this.oscillator.clear()
    this.isOscilloscopeOpen = false
  }
}
