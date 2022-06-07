import { setActivePinia, createPinia } from 'pinia'
import PortType from '@/types/enums/PortType'
import ItemType from '@/types/enums/ItemType'
import {
  createItem,
  createPort,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'
import rotation from '../../geometry/rotation'
import ItemSubtype from '@/types/enums/ItemSubtype'
import { LogicValue } from '@/circuit'

setActivePinia(createPinia())

describe('simulation actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('stop', () => {
    const store = createDocumentStore('document')()

    it('should pause the simulation', () => {
      jest
        .spyOn(store.simulation, 'pause')
        .mockImplementation(jest.fn())

      store.stop()

      expect(store.simulation.pause).toHaveBeenCalledTimes(1)
    })
  })

  describe('start', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      jest
        .spyOn(store.simulation, 'unpause')
        .mockImplementation(jest.fn())
    })

    it('should un-pause the simulation', () => {
      store.isDebugging = false
      store.start()

      expect(store.simulation.unpause).toHaveBeenCalledTimes(1)
    })

    it('should not un-pause the simulation when debugging', () => {
      store.isDebugging = true
      store.start()

      expect(store.simulation.unpause).not.toHaveBeenCalled()
    })
  })


  describe('onSimulationUpdate()', () => {
    const store = createDocumentStore('document')()
    const port1 = createPort('port1', 'item1', PortType.Input)
    const port2 = createPort('port2', 'item2', PortType.Output)
    const valueMap = {
      port1: LogicValue.TRUE,
      port2: LogicValue.FALSE,
      invalidPort: LogicValue.UNKNOWN
    }
    const oscillogram: Oscillogram = {
      port1: {
        points: '0,1 1,0',
        width: 2,
        hue: 0
      }
    }

    beforeEach(() => {
      store.ports = { port1, port2 }
      store.onSimulationUpdate(valueMap, oscillogram)
    })

    afterEach(() => store.$reset())

    it('should not set non-existing ports specified in the value map', () => {
      expect(store.ports).not.toHaveProperty('invalidPort')
    })

    it('should update the store\'s oscillogram with the one provided', () => {
      expect(store.oscillogram).toEqual(oscillogram)
    })
  })

  describe('resetCircuit()', () => {
    const store = createDocumentStore('document')()
    const port1 = createPort('port1', 'item1', PortType.Input)
    const port2 = createPort('port2', 'item2', PortType.Output)
    const item1 = createItem('item1', ItemType.InputNode)
    const item2 = createItem('item2', ItemType.InputNode, {
      portIds: ['port2'],
      properties: {
        startValue: {
          value: LogicValue.TRUE,
          label: 'Start value',
          type: 'number'
        }
      }
    })

    beforeEach(() => {
      store.ports = { port1, port2 }
      store.items = { item1, item2 }

      jest
        .spyOn(store.simulation, 'on')
        .mockImplementation(jest.fn())
    })

    afterEach(() => store.$reset())

    it('should stop the active oscillation', () => {
      const spy = jest
        .spyOn(store.simulation.oscillator, 'stop')
        .mockImplementation(jest.fn())

      store.resetCircuit()

      expect(spy).toHaveBeenCalledTimes(1)
    })

    xit('should update the all the port values to HI-Z', () => {
      expect(store.ports.port1.value).toEqual(0)
      expect(store.ports.port2.value).toEqual(0)
    })

    xit('should set the value of the ports belonging to an item having a start value to that value', () => {
      expect(store.ports.port2.value).toEqual(LogicValue.TRUE)
    })
  })
})