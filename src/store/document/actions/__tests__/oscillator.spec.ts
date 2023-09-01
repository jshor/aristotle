import { setActivePinia, createPinia } from 'pinia'
import PortType from '@/types/enums/PortType'
import ItemType from '@/types/enums/ItemType'
import {
  createConnection,
  createIntegratedCircuit,
  createItem,
  createPort,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'
import { CircuitNode, LogicValue } from '@/circuit'
import circuitNodeMapper from '@/utils/circuitNodeMapper'
import ItemSubtype from '@/types/enums/ItemSubtype'
import ClockService from '@/services/ClockService'
import BinaryWaveService from '@/services/BinaryWaveService'

setActivePinia(createPinia())

describe('simulation actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('toggleOscillatorRecording()', () => {
    const store = createDocumentStore('document')()

    it('should start the oscillator if it is paused', () => {
      jest
        .spyOn(store.oscillator, 'start')
        .mockImplementation(jest.fn())

      store.oscillator.isPaused = true
      store.toggleOscillatorRecording()

      expect(store.oscillator.start).toHaveBeenCalledTimes(1)
      expect(store.isOscilloscopeRecording).toBe(true)
      expect(store.oscillator.isPaused).toBe(false)
    })

    it('should stop the oscillator if running', () => {
      jest
        .spyOn(store.oscillator, 'stop')
        .mockImplementation(jest.fn())

      store.oscillator.isPaused = false
      store.toggleOscillatorRecording()

      expect(store.oscillator.stop).toHaveBeenCalledTimes(1)
      expect(store.isOscilloscopeRecording).toBe(false)
      expect(store.oscillator.isPaused).toBe(true)
    })
  })

  describe('toggleOscilloscope()', () => {
    const store = createDocumentStore('document')()

    it('should open the oscilloscope if closed', () => {
      stubAll(store, ['openOscilloscope'])

      store.isOscilloscopeOpen = false
      store.toggleOscilloscope()

      expect(store.openOscilloscope).toHaveBeenCalledTimes(1)
    })

    it('should close the oscilloscope if open', () => {
      stubAll(store, ['closeOscilloscope'])

      store.isOscilloscopeOpen = true
      store.toggleOscilloscope()

      expect(store.closeOscilloscope).toHaveBeenCalledTimes(1)
    })
  })

  describe('openOscilloscope()', () => {
    const store = createDocumentStore('document')()
    const port1 = createPort('port1', 'item', PortType.Input, { isMonitored: true })
    const port2 = createPort('port2', 'item', PortType.Output)

    beforeEach(() => {
      store.$reset()
      store.$patch({
        ports: { port1, port2 },
        isOscilloscopeOpen: false
      })

      stubAll(store, ['monitorPort'])

      store.openOscilloscope()
    })

    it('should re-monitor all ports that were previously monitored', () => {
      expect(store.monitorPort).toHaveBeenCalledTimes(1)
      expect(store.monitorPort).toHaveBeenCalledWith('port1')
      expect(store.monitorPort).not.toHaveBeenCalledWith('port2')
    })

    it('should set isOscilloscopeOpen to true', () => {
      expect(store.isOscilloscopeOpen).toBe(true)
    })
  })

  describe('closeOscilloscope()', () => {
    const store = createDocumentStore('document')()
    const port1 = createPort('port1', 'item', PortType.Input)
    const port2 = createPort('port2', 'item', PortType.Output)

    beforeEach(() => {
      store.$reset()
      store.$patch({
        ports: { port1, port2 },
        isOscilloscopeOpen: true,
        oscilloscopeHeight: 0
      })

      jest
        .spyOn(store.oscillator, 'clear')
        .mockImplementation(jest.fn())

      stubAll(store, ['unmonitorPort'])
    })

    it('should attempt to un-monitor all ports', () => {
      store.closeOscilloscope()

      expect(store.unmonitorPort).toHaveBeenCalledTimes(2)
      expect(store.unmonitorPort).toHaveBeenCalledWith('port1')
      expect(store.unmonitorPort).toHaveBeenCalledWith('port2')
    })

    it('should set isOscilloscopeOpen to false', () => {
      store.closeOscilloscope()

      expect(store.isOscilloscopeOpen).toBe(false)
    })

    it('should clear the oscillator state', () => {
      store.closeOscilloscope()

      expect(store.oscillator.clear).toHaveBeenCalledTimes(1)
    })

    it('should store the user-defined height of the oscilloscope in the state', () => {
      const height = 234

      store.closeOscilloscope(height)

      expect(store.oscilloscopeHeight).toBe(height)
    })

    it('should not change the state if the oscilloscope is not open', () => {
      store.isOscilloscopeOpen = false
      store.closeOscilloscope()

      expect(store.unmonitorPort).not.toHaveBeenCalled()
      expect(store.oscillator.clear).not.toHaveBeenCalled()
      expect(store.isOscilloscopeOpen).toBe(false)
    })
  })
})
