import { DocumentStoreInstance } from '..'

/**
 * Toggles the oscillator's wave recording.
 */
export function toggleOscillatorRecording (this: DocumentStoreInstance) {
  if (this.oscillator.isPaused) {
    this.oscillator.start()
  } else {
    this.oscillator.stop()
  }

  this.oscillator.isPaused = !this.oscillator.isPaused
  this.isOscilloscopeRecording = !this.oscillator.isPaused
}

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
  Object
    .values(this.ports)
    .forEach(port => {
      if (port.isMonitored) {
        this.monitorPort(port.id)
      }
    })

  this.isOscilloscopeOpen = true
}

/**
 * Closes the oscilloscope panel.
 * This will pause monitoring all ports while closed to save computation.
 */
export function closeOscilloscope (this: DocumentStoreInstance, lastHeight?: number) {
  if (!this.isOscilloscopeOpen) return

  Object
    .keys(this.ports)
    .forEach(id => this.unmonitorPort(id))

  this.oscillator.clear()
  this.isOscilloscopeOpen = false

  if (lastHeight) {
    this.oscilloscopeHeight = lastHeight
  }
}
