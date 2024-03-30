import { setActivePinia, createPinia } from 'pinia'
import { merge } from 'lodash'
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
import BinaryWavePulse from '../../oscillator/BinaryWavePulse'
import LogicValue from '@/types/enums/LogicValue'
import ClockPulse from '../../oscillator/ClockPulse'
import Point from '@/types/interfaces/Point'
import ItemProperties from '@/types/interfaces/ItemProperties'
import Port from '@/types/interfaces/Port'
import cloneDeep from 'lodash.clonedeep'
import portFactory from '@/factories/portFactory'

setActivePinia(createPinia())

describe('item actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('addItem', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
      stubAll(store, ['addVirtualNode'])
    })

    describe('when the item is not an integrated circuit', () => {
      const item = createItem('item', ItemType.InputNode, { portIds: ['port'] })
      const port = createPort('port', 'item', PortType.Output)

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
        expect(store.addVirtualNode).toHaveBeenCalledTimes(1)
        expect(store.addVirtualNode).toHaveBeenCalledWith(item, store.ports)
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
        expect(store.addVirtualNode).toHaveBeenCalledTimes(1)
        expect(store.addVirtualNode).toHaveBeenCalledWith(icItem, icItem.integratedCircuit!.ports)
      })
    })
  })

  describe('setItemName()', () => {
    const store = createDocumentStore('document')()
    const createProperties = (name: string): ItemProperties => ({
      name: {
        value: name,
        label: 'Name',
        type: 'text'
      }
    })

    beforeEach(() => {
      store.$reset()

      stubAll(store, ['setPortName'])
    })

    it('should increment the item name if it already exists', () => {
      const item1 = createItem('item1', ItemType.InputNode, {
        defaultName: 'MyNode',
        properties: createProperties('MyNode')
      })
      const item2 = createItem('item2', ItemType.InputNode, {
        defaultName: 'MyNode',
        properties: createProperties('MyNode')
      })

      store.$patch({
        items: { item1, item2 }
      })

      store.setItemName(item1)
      expect(item1.properties.name!.value).toEqual('MyNode')

      store.setItemName(item2)
      expect(item2.properties.name!.value).toEqual('MyNode 2')
    })

    it('should increment the default node name when one is not defined in its properties', () => {
      const item1 = createItem('item1', ItemType.InputNode, {
        defaultName: 'CustomNode',
        properties: createProperties('')
      })
      const item2 = createItem('item2', ItemType.InputNode, {
        defaultName: 'CustomNode',
        properties: createProperties('')
      })

      store.$patch({
        items: { item1, item2 }
      })

      store.setItemName(item1)
      expect(item1.properties.name!.value).toEqual('CustomNode')

      store.setItemName(item2)
      expect(item2.properties.name!.value).toEqual('CustomNode 2')
    })

    it('should set the port names for each of the item\'s ports', () => {
      const item1 = createItem('item1', ItemType.InputNode, {
        properties: createProperties('MyNode'),
        portIds: ['port1', 'port2', 'port3', 'port4']
      })

      store.$patch({
        items: { item1 }
      })

      store.setItemName(item1)

      expect(store.setPortName).toHaveBeenCalledTimes(4)
      expect(store.setPortName).toHaveBeenCalledWith('port1')
      expect(store.setPortName).toHaveBeenCalledWith('port2')
      expect(store.setPortName).toHaveBeenCalledWith('port3')
      expect(store.setPortName).toHaveBeenCalledWith('port4')
    })
  })

  describe('insertItemAtPosition', () => {
    const item = createItem('item', ItemType.InputNode, {
      portIds: ['port'],
      width: 10,
      height: 20
    })
    const port = createPort('port', 'item', PortType.Output)
    const store = createDocumentStore('document')()
    const getMockedViewport = (width: number, height: number): DOMRect => ({
      x: 0,
      y: 0,
      width,
      height,
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      toJSON: () => null
    })
    const getPortDictionary = (...ports: Port[]) => ({
      [Direction.Left]: ports,
      [Direction.Right]: [],
      [Direction.Top]: [],
      [Direction.Bottom]: []
    })

    beforeEach(() => {
      stubAll(store, [
        'commitState',
        'addItem',
        'setItemBoundingBox',
        'setItemSelectionState'
      ])
    })

    describe('when a document position is provided that is outside of the viewport range', () => {
      beforeEach(() => {
        store.viewport = getMockedViewport(100, 100)
      })

      function testPosition (position: Point, text: string) {
        it(`should not add the item if the item is ${text} of the viewport`, () => {
          store.insertItemAtPosition({ item, ports: getPortDictionary(port) }, position)

          expect(store.addItem).not.toHaveBeenCalled()
          expect(store.commitState).not.toHaveBeenCalled()
          expect(store.setItemBoundingBox).not.toHaveBeenCalled()
          expect(store.setItemSelectionState).not.toHaveBeenCalled()
        })
      }

      testPosition({ x: -100, y: 20 }, 'to the left')
      testPosition({ x: 1000, y: 20 }, 'to the right')
      testPosition({ x: 0, y: -2000 }, 'above')
      testPosition({ x: 0, y: 2000 }, 'below')
    })

    describe('when a document position within the viewport range is provided', () => {
      const documentPosition = { x: 50, y: 50 }

      beforeEach(() => {
        store.viewport = getMockedViewport(1000, 1000)
        store.insertItemAtPosition({ item, ports: getPortDictionary(port) }, documentPosition)
      })

      it('should add the item at the provided position', () => {
        expect(store.addItem).toHaveBeenCalledWith({ item, ports: { port } })
        expect(item.position.x).toEqual(documentPosition.x - item.width / 2)
        expect(item.position.y).toEqual(documentPosition.y - item.height / 2)
      })

      it('should set the item bounding box', () => {
        expect(store.setItemBoundingBox).toHaveBeenCalledWith(item.id)
      })

      it('should set the selection state of the item', () => {
        expect(store.setItemSelectionState).toHaveBeenCalledWith(item.id, true)
      })
    })

    describe('when no document position was specified', () => {
      const width = 1000
      const height = 2000

      beforeEach(() => {
        store.viewport = getMockedViewport(width, height)
        store.insertItemAtPosition({ item, ports: getPortDictionary(port) })
      })

      it('should add the item at the midpoint of the viewport', () => {
        expect(store.addItem).toHaveBeenCalledWith({ item, ports: { port } })
        expect(item.position.x).toEqual(width / 2 - item.width / 2)
        expect(item.position.y).toEqual(height / 2 - item.height / 2)
      })

      it('should set the item bounding box', () => {
        expect(store.setItemBoundingBox).toHaveBeenCalledWith(item.id)
      })

      it('should set the selection state of the item', () => {
        expect(store.setItemSelectionState).toHaveBeenCalledWith(item.id, true)
      })
    })
  })

  describe('resetItemValue', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => stubAll(store, ['setPortValue']))

    it('should not do anything if the item has no start value', () => {
      const item = createItem('item', ItemType.InputNode, { portIds: ['port'] })

      store.resetItemValue(item)

      expect(store.setPortValue).not.toHaveBeenCalled()
    })

    it('should set the port value to the start value', () => {
      const item = createItem('item', ItemType.InputNode, {
        portIds: ['port'],
        properties: {
          startValue: {
            value: 1,
            label: 'Start value',
            type: 'number'
          }
        }
      })

      store.resetItemValue(item)

      expect(store.setPortValue).toHaveBeenCalledTimes(1)
      expect(store.setPortValue).toHaveBeenCalledWith({ id: 'port', value: 1 })
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

        stubAll(store, [
          'removeVirtualNode',
          'removePort'
        ])

        store.removeElement('icItem')
      })

      it('should remove each port associated to the IC', () => {
        expect(store.removePort).toHaveBeenCalledTimes(2)
        expect(store.removePort).toHaveBeenCalledWith('port1')
        expect(store.removePort).toHaveBeenCalledWith('port2')
      })

      it('should remove each embedded IC item from the circuit', () => {
        expect(store.removeVirtualNode).toHaveBeenCalledTimes(1)
        expect(store.removeVirtualNode).toHaveBeenCalledWith(icItem.id)
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

        stubAll(store, [
          'removeVirtualNode',
          'removePort'
        ])

        store.removeElement('item1')
      })

      it('should remove each port associated to the IC', () => {
        expect(store.removePort).toHaveBeenCalledTimes(2)
        expect(store.removePort).toHaveBeenCalledWith('port1')
        expect(store.removePort).toHaveBeenCalledWith('port2')
      })

      it('should remove the node from the circuit', () => {
        expect(store.removeVirtualNode).toHaveBeenCalledTimes(1)
        expect(store.removeVirtualNode).toHaveBeenCalledWith(item1.id)
      })

      it('should not remove ports that are not associated to the item', () => {
        expect(store.ports).toHaveProperty('port3')
        expect(store.ports.port3).toEqual(port3)
      })

      it('should remove the item', () => {
        expect(store.items).not.toHaveProperty('item1')
      })
    })

    it('should not do anything if the item does not exist', () => {
      stubAll(store, [
        'removeVirtualNode',
        'removePort'
      ])

      store.removeElement('item-that-does-not-exist')

      expect(store.removeVirtualNode).not.toHaveBeenCalled()
      expect(store.removePort).not.toHaveBeenCalled()
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
        'removePort',
        'setPortName'
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
        const port = Object.values(store.ports).slice(-1)[0]

        expect(store.addPort).toHaveBeenCalledWith(id, portFactory(id, expect.any(String), Direction.Left, PortType.Input))
        expect(store.items.item1.portIds).toContain(port.id)
      })
    })

    describe('when the input count is decreased', () => {
      beforeEach(() => {
        store.setInputCount(id, 1)
      })

      it('should remove the difference number of input ports at the end of the list', () => {
        expect(store.removePort).toHaveBeenCalledWith(port3.id)
      })
    })
  })
})
