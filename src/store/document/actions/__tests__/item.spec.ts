import { setActivePinia, createPinia } from 'pinia'
import Direction from '@/types/enums/Direction'
import PortType from '@/types/enums/PortType'
import ItemType from '@/types/enums/ItemType'
import {
  createIntegratedCircuit,
  createItem,
  createPort,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'

setActivePinia(createPinia())

describe('item actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('addItem', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      jest
        .spyOn(store.simulation, 'addNode')
        .mockImplementation(jest.fn())
    })

    describe('when the item is not an integrated circuit', () => {
      const item = createItem('item', ItemType.InputNode, { portIds: ['port'] })
      const port = createPort('port', 'item1', PortType.Output)

      beforeEach(() => {
        store.addItem({ item, ports: { port } })
      })

      it('should add the ports to the state', () => {
        expect(store.ports).toHaveProperty('port')
        expect(store.ports.port).toEqual(port)
      })

      it('should add the item to the state', () => {
        expect(store.items).toHaveProperty('item')
        expect(store.items.item).toEqual(item)
      })

      it('should add the item as a node to the circuit', () => {
        expect(store.simulation.addNode).toHaveBeenCalledTimes(1)
        expect(store.simulation.addNode).toHaveBeenCalledWith(item, store.ports)
      })
    })

    describe('when the item is an integrated circuit', () => {
      const port1 = createPort('port1', 'icItem', PortType.Input)
      const port2 = createPort('port2', 'icItem', PortType.Output)
      const icItem = createItem('icItem', ItemType.IntegratedCircuit, {
        integratedCircuit: createIntegratedCircuit({
          items: {},
          ports: { port1, port2 },
          connections: {}
        }),
        portIds: ['port2']
      })

      beforeEach(() => {
        store.addItem({ item: icItem, ports: {} })
      })

      xit('should add each port that is visible to the user to the state', () => {
        expect(store.ports).not.toHaveProperty('port1')
        expect(store.ports).toHaveProperty('port2')
        expect(store.ports.port2).toEqual(port2)
      })

      it('should add the integrated circuit item to the state', () => {
        expect(store.items).toHaveProperty('icItem')
        expect(store.items.icItem).toEqual(icItem)
      })

      it('should install the integrated circuit onto the active circuit', () => {
        expect(store.simulation.addNode).toHaveBeenCalledTimes(1)
        expect(store.simulation.addNode).toHaveBeenCalledWith(icItem, store.ports)
      })
    })
  })

  describe('removeElement', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => store.$reset())

    describe('when the item is an integrated circuit', () => {
      const node1 = createItem('node1', ItemType.CircuitNode, { portIds: ['node1port'] })
      const node2 = createItem('node2', ItemType.CircuitNode, { portIds: ['node2port'] })
      const icItem = createItem('icItem', ItemType.IntegratedCircuit, {
        integratedCircuit: createIntegratedCircuit({
          items: { node1, node2 }
        }),
        portIds: ['port1', 'port2']
      })
      const port1 = createPort('port1', 'icItem', PortType.Input)
      const port2 = createPort('port2', 'icItem', PortType.Output)
      const port3 = createPort('port3', 'otherItem', PortType.Output)

      beforeEach(() => {
        store.$patch({
          items: { icItem },
          ports: { port1, port2, port3 }
        })

        jest
          .spyOn(store.simulation, 'removeNode')
          .mockImplementation(jest.fn())
        jest
          .spyOn(store, 'removePort')
          .mockImplementation(jest.fn())

        store.removeElement('icItem')
      })

      it('should remove each port associated to the IC', () => {
        expect(store.removePort).toHaveBeenCalledTimes(2)
        expect(store.removePort).toHaveBeenCalledWith('port1')
        expect(store.removePort).toHaveBeenCalledWith('port2')
      })

      it('should remove each embedded IC item from the circuit', () => {
        expect(store.simulation.removeNode).toHaveBeenCalledTimes(1)
        expect(store.simulation.removeNode).toHaveBeenCalledWith(icItem)
      })

      it('should not remove ports that are not associated to the IC', () => {
        expect(store.removePort).not.toHaveBeenCalledWith('port3')
      })

      it('should remove the IC item', () => {
        expect(store.items).not.toHaveProperty('icItem')
      })
    })

    describe('when the item is regular, non-IC element', () => {
      const item1 = createItem('item1', ItemType.LogicGate, { portIds: ['port1', 'port2'] })
      const port1 = createPort('port1', 'icItem', PortType.Input)
      const port2 = createPort('port2', 'icItem', PortType.Output)
      const port3 = createPort('port3', 'otherItem', PortType.Output)

      beforeEach(() => {
        store.$patch({
          items: { item1 },
          ports: { port1, port2, port3 }
        })

        jest
          .spyOn(store.simulation, 'removeNode')
          .mockImplementation(jest.fn())
        jest
          .spyOn(store, 'removePort')
          .mockImplementation(jest.fn())


        store.removeElement('item1')
      })


      it('should remove each port associated to the IC', () => {
        expect(store.removePort).toHaveBeenCalledTimes(2)
        expect(store.removePort).toHaveBeenCalledWith('port1')
        expect(store.removePort).toHaveBeenCalledWith('port2')
      })

      it('should remove the node from the circuit', () => {
        expect(store.simulation.removeNode).toHaveBeenCalledTimes(1)
        expect(store.simulation.removeNode).toHaveBeenCalledWith(item1)
      })

      it('should not remove ports that are not associated to the item', () => {
        expect(store.ports).toHaveProperty('port3')
        expect(store.ports.port3).toEqual(port3)
      })

      it('should remove the item', () => {
        expect(store.items).not.toHaveProperty('item1')
      })
    })
  })


  describe('setInputCount', () => {
    const store = createDocumentStore('document')()

    const id = 'item1'
    const port1 = createPort('port1', id, PortType.Input)
    const port2 = createPort('port2', id, PortType.Output)
    const port3 = createPort('port3', id, PortType.Input)
    const item1 = createItem(id, ItemType.InputNode, {
      portIds: [port1.id, port2.id, port3.id],
      properties: {
        inputCount: {
          value: 2,
          type: 'number',
          label: 'Input Count'
        }
      }
    })

    beforeEach(() => {
      stubAll(store, [
        'addPort',
        'removePort'
      ])

      store.$reset()
      store.$patch({
        items: { item1 },
        ports: { port1, port2, port3 }
      })
    })

    describe('when the input count is increased', () => {
      beforeEach(() => {
        store.setInputCount(id, 4)
      })

      it('should add the difference number of input ports', () => {
        const portId = Object.keys(store.ports).slice(-1)[0]

        expect(store.addPort).toHaveBeenCalledWith(id, {
          id: expect.any(String),
          name: expect.any(String),
          connectedPortIds: [],
          type: PortType.Input,
          elementId: id,
          virtualElementId: id,
          orientation: Direction.Left,
          isFreeport: false,
          isMonitored: false,
          hue: 0,
          position: {
            x: 0,
            y: 0
          },
          rotation: 0,
          value: 0
        })
        expect(store.items.item1.portIds).toContain(portId)
      })
    })

    describe.skip('when the input count is decreased', () => {
      beforeEach(() => {
        store.setInputCount(id, 1)
      })

      it('should remove the difference number of input ports at the end of the list', () => {
        expect(store.removePort).toHaveBeenCalledWith(port3.id)
      })

      it('should set the item port positions', () => {
        expect(store.setItemPortPositions).toHaveBeenCalledWith(id)
      })
    })
  })

  describe('setProperties', () => {
    const store = createDocumentStore('document')()

    const id = 'item1'
    const createProperties = (): PropertySet => ({
      inputCount: {
        value: 2,
        label: 'Input Count',
        type: 'number'
      },
      showInOscilloscope: {
        value: true,
        label: 'Show in oscilloscope',
        type: 'boolean'
      },
      name: {
        value: 'Some name',
        label: 'Name',
        type: 'text'
      }
    })

    beforeEach(() => {
      stubAll(store, [
        'setInputCount'
      ])

      store.$reset()
    })

    it('should not change anything if no properties have changed', () => {
      const properties = createProperties()
      const item1 = createItem(id, ItemType.LogicGate, { properties })

      store.$patch({
        items: { item1 }
      })
      store.setProperties(id, properties)

      expect(store.setInputCount).not.toHaveBeenCalled()
    })

    it('should dispatch setInputCount when the inputCount has changed', () => {
      const item1 = createItem(id, ItemType.LogicGate, { properties: createProperties() })
      const properties = createProperties()

      properties.inputCount.value = 3

      store.$patch({
        items: { item1 }
      })
      store.setProperties(id, properties)

      expect(store.setInputCount).toHaveBeenCalledWith(id, 3)
    })

    it('should set the new item property value', () => {
      const propertyName = 'name'
      const value = 'New value'
      const item1 = createItem(id, ItemType.LogicGate, { properties: createProperties() })
      const properties = createProperties()
      properties[propertyName].value = value

      store.$patch({
        items: { item1 }
      })
      store.setProperties(id, properties)

      expect(store.items[id].properties[propertyName].value).toEqual(value)
    })
  })
})
