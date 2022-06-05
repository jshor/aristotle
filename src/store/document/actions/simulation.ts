import SimulationService from '@/services/SimulationService'
import { DocumentStoreInstance } from '..'

/**
 * Stops the simulation.
 */
export function stop (this: DocumentStoreInstance) {
  this.simulation.pause()
}

/**
 * Restarts the simulation (if not in debugging mode).
 */
export function start (this: DocumentStoreInstance) {
  if (!this.isDebugging) {
    this.simulation.unpause()
  }
}

export function buildCircuit (this: DocumentStoreInstance) {
  this.simulation.oscillator?.stop()

  const simulation = new SimulationService(Object.values(this.items), Object.values(this.connections), this.ports)

  simulation.on('change', (valueMap: Record<string, number>, oscillogram: Oscillogram) => {
    for (const portId in valueMap) {
      if (this.ports[portId]) {
        this.ports[portId].value = valueMap[portId]
      }
    }

    this.isCircuitEvaluated = !this.simulation.canContinue
    this.oscillogram = oscillogram
  })

  this.simulation = simulation
}

/**
 * Updates the store according to the port-value mapping provided.
 * This also accepts oscillogram to update the visual oscilloscope.
 */
export function onSimulationUpdate (this: DocumentStoreInstance, valueMap: Record<string, number>, oscillogram: Oscillogram) {
  for (const portId in valueMap) {
    if (this.ports[portId]) {
      this.ports[portId].value = valueMap[portId]
    }
  }

  this.isCircuitEvaluated = !this.simulation.canContinue
  this.oscillogram = oscillogram
}

export function resetCircuit (this: DocumentStoreInstance) {
  const items = Object.values(this.items)
  const connections = Object.values(this.connections)

  Object
    .values(this.ports)
    .forEach(port => {
      port.value = 0
    })

  this.simulation.oscillator?.stop()
  this.simulation = new SimulationService(items, connections, this.ports)
  this.simulation.on('change', this.onSimulationUpdate)

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

  this.simulation.unpause()

  if (this.isDebugging) {
    this.simulation.startDebugging()
    this.isCircuitEvaluated = !this.simulation.canContinue
  }
}

export function stepThroughCircuit (this: DocumentStoreInstance) {
  this.simulation.advance()
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

export default {
  stop,
  start,
  buildCircuit,
  onSimulationUpdate,
  resetCircuit,
  toggleDebugger,
  stepThroughCircuit,
  toggleOscilloscope,
  openOscilloscope,
  closeOscilloscope,
  clearOscilloscope
}
