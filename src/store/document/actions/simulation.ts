import SimulationService from '@/services/SimulationService'
import { DocumentStoreInstance } from '..'

/**
 * Restarts the simulation (if not in debugging mode).
 */
export function toggleOscillatorRecording (this: DocumentStoreInstance) {
  if (this.simulation.oscillator.isPaused) {
    this.simulation.oscillator.start()
  } else {
    this.simulation.oscillator.stop()
  }

  this.isOscilloscopeRecording = !this.simulation.oscillator.isPaused
}

/**
 * Updates the store according to the port-value mapping provided.
 * This also accepts oscillogram to update the visual oscilloscope.
 */
export function onSimulationUpdate (this: DocumentStoreInstance, valueMap: Record<string, number>) {
  for (const portId in valueMap) {
    if (this.ports[portId]) {
      const port = this.ports[portId]
      const item = this.items[port.elementId]

      if (item && port.value !== valueMap[portId]) {
        this.debugger.hasUpdated = true
      }

      port.value = valueMap[portId]
    }
  }

  this.isCircuitEvaluated = !this.simulation.canContinue

  clearTimeout(this.debugger.timeout)

  this.debugger.timeout = window.setTimeout(() => {
    // if the user can still advance a step and the circuit hasn't finished evaluating yet, step over again
    // this is in a timeout in order to wait for the next JS frame (by which time all event emissions will have completed)
    if (!this.debugger.hasUpdated && this.simulation.canContinue && this.isDebugging) {
      this.debugger.hasUpdated = false
      this.simulation.advanceDebuggerStep()
    }
  })
}

export function onError (this: DocumentStoreInstance, error: string) {
  window.api.showMessageBox({
    message: 'An infinite loop was detected! Entering debugger mode.',
    type: 'error'
  })

  this.isDebugging = true
  this.simulation.startDebugging()
}

export function resetCircuit (this: DocumentStoreInstance) {
  const items = Object.values(this.items)
  const connections = Object.values(this.connections)

  Object
    .values(this.ports)
    .forEach(port => {
      port.value = 0
    })

  this.simulation.stop()
  this.simulation = new SimulationService(items, connections, this.ports)
  this.simulation.onChange(this.onSimulationUpdate)
  this.simulation.onError(this.onError)

  // set the callback to update the oscilloscope when the oscillogram updates
  this.simulation.oscillator.on('change', oscillogram => {
    this.oscillogram = oscillogram
  })

  // apply the initial port values
  Object
    .values(this.items)
    .forEach(({ properties, portIds }) => {
      if (properties?.startValue) {
        portIds.forEach(portId => this.setPortValue({
          id: portId,
          value: properties.startValue.value as number
        }))
      }
    })

  this.simulation.start()

  if (this.isDebugging) {
    this.simulation.startDebugging()
    this.isCircuitEvaluated = !this.simulation.canContinue
  }
}

export function stepThroughCircuit (this: DocumentStoreInstance) {
  this.debugger.hasUpdated = false
  this.simulation.advanceDebuggerStep()
  this.isCircuitEvaluated = !this.simulation.canContinue
}

export function toggleDebugger (this: DocumentStoreInstance) {


  if (this.isDebugging) {
    this.simulation.stopDebugging()
  } else {
    this.simulation.startDebugging()
  }

  this.isDebugging = !this.isDebugging
}

export function toggleOscilloscope (this: DocumentStoreInstance) {
  if (this.isOscilloscopeOpen) {
    this.closeOscilloscope()
  } else {
    this.openOscilloscope()
  }
}

export function openOscilloscope (this: DocumentStoreInstance) {
  Object
    .values(this.ports)
    .forEach(port => {
      if (port.isMonitored) {
        this.simulation.monitorPort(port.id, port.value, port.hue)
      }
    })

  this.isOscilloscopeOpen = true
}

export function closeOscilloscope (this: DocumentStoreInstance, lastHeight?: number) {
  if (!this.isOscilloscopeOpen) return

  Object
    .keys(this.ports)
    .forEach(this.simulation.unmonitorPort)

  this.simulation.oscillator.clear()
  this.isOscilloscopeOpen = false

  if (lastHeight) {
    this.oscilloscopeHeight = lastHeight
  }
}

export function clearOscilloscope (this: DocumentStoreInstance) {
  this.simulation.oscillator.clear()
}
