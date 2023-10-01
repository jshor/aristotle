import { setActivePinia, createPinia } from 'pinia'
import PortType from '@/types/enums/PortType'
import {
  createPort,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'

setActivePinia(createPinia())

describe('oscillator actions', () => {
  beforeEach(() => jest.restoreAllMocks())

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
    const port1 = createPort('port1', 'item', PortType.Input)
    const port2 = createPort('port2', 'item', PortType.Output)

    beforeEach(() => {
      store.$reset()
      store.$patch({
        ports: { port1, port2 },
        monitoredPortIds: ['port1'],
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
        monitoredPortIds: ['port1', 'port2'],
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
      expect(store.unmonitorPort).toHaveBeenCalledWith('port1', false)
      expect(store.unmonitorPort).toHaveBeenCalledWith('port2', false)
    })

    it('should set isOscilloscopeOpen to false', () => {
      store.closeOscilloscope()

      expect(store.isOscilloscopeOpen).toBe(false)
    })

    it('should clear the oscillator state', () => {
      store.closeOscilloscope()

      expect(store.oscillator.clear).toHaveBeenCalledTimes(1)
    })

    it('should not change the state if the oscilloscope is not open', () => {
      store.isOscilloscopeOpen = false
      store.closeOscilloscope()

      expect(store.unmonitorPort).not.toHaveBeenCalled()
      expect(store.oscillator.clear).not.toHaveBeenCalled()
      expect(store.isOscilloscopeOpen).toBe(false)
    })
  })

  describe('destroyOscilloscope()', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
    })

    it('should do nothing if the user cancels the dialog', () => {
      jest
        .spyOn(window.api, 'showMessageBox')
        .mockReturnValue(1)
      jest
        .spyOn(store.oscillator, 'clear')
        .mockImplementation(jest.fn())

      stubAll(store, ['unmonitorPort'])

      store.destroyOscilloscope()

      expect(store.unmonitorPort).not.toHaveBeenCalled()
      expect(store.oscillator.clear).not.toHaveBeenCalled()
    })

    describe('when the user confirms that they want to remove all waves', () => {
      const port1 = createPort('port1', 'item', PortType.Input)
      const port2 = createPort('port2', 'item', PortType.Output)

      beforeEach(() => {
        store.$reset()
        store.$patch({
          ports: { port1, port2 },
          monitoredPortIds: ['port1', 'port2'],
          isOscilloscopeOpen: true
        })

        jest
          .spyOn(window.api, 'showMessageBox')
          .mockReturnValue(0)

        jest
          .spyOn(store.oscillator, 'clear')
          .mockImplementation(jest.fn())

        stubAll(store, ['unmonitorPort'])

        store.destroyOscilloscope()
      })

      it('should un-monitor all ports', () => {
        expect(store.unmonitorPort).toHaveBeenCalledTimes(2)
        expect(store.unmonitorPort).toHaveBeenCalledWith('port1')
        expect(store.unmonitorPort).toHaveBeenCalledWith('port2')
      })

      it('should clear the oscillator state', () => {
        expect(store.oscillator.clear).toHaveBeenCalledTimes(1)
      })

      it('should set isOscilloscopeOpen to false', () => {
        expect(store.isOscilloscopeOpen).toBe(false)
      })
    })
  })
})
