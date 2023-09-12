import { setActivePinia, createPinia } from 'pinia'
import boundaries from '../../geometry/boundaries'
import ItemType from '@/types/enums/ItemType'
import {
  createConnectionChain,
  createConnection,
  createGroup,
  createItem,
  createPort,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'
import PortType from '@/types/enums/PortType'
import LogicValue from '@/types/enums/LogicValue'
import idMapper from '@/utils/idMapper'
import ClipboardData from '@/types/interfaces/ClipboardData'

setActivePinia(createPinia())

describe('clipboard actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  describe('cut()', () => {
    it('should invoke copy() and deleteSelection()', () => {
      const store = createDocumentStore('document')()

      stubAll(store, [
        'copy',
        'deleteSelection'
      ])

      store.cut()

      expect(store.copy).toHaveBeenCalledTimes(1)
      expect(store.deleteSelection).toHaveBeenCalledTimes(1)
    })
  })

  describe('copy()', () => {
    const store = createDocumentStore('document')()

    let clipboardData: ClipboardData

    /**
     * build a document containing the following:
     *
     * (1) four items: item1, item2, item3, item4
     *
     * (2) another connection chain broken into two segments, with one freeport joining them
     *     the chain source is attached to item3, and the chain target is attached to item4
     *
     * (3) a connection chain broken into three segments, with two freeports joining them
     *     the chain source is attached to item1, and the chain target is attached to item2
     *
     * (4) a group containing item1 and item2
     *
     * item1, item2, and item3 are selected, as well as the freeport from chain (2)
     *
     * item1, item2, and item3, the group, and the entire chain from (3) should be copied
     * the freeport from chain (2) should not be copied since its target is not selected,
     * and orphaned freeports should never be copied
     */
    const port1 = createPort('port1', 'item1', PortType.Output)
    const port2 = createPort('port2', 'item2', PortType.Input)
    const port3 = createPort('port3', 'item3', PortType.Output)
    const port4 = createPort('port4', 'item4', PortType.Input)
    const port5 = createPort('port5', 'item5', PortType.Input)
    const port6 = createPort('port6', 'item6', PortType.Input)
    const item1 = createItem('item1', ItemType.InputNode, { portIds: ['port1'], groupId: 'group' })
    const item2 = createItem('item2', ItemType.OutputNode, { portIds: ['port2'], groupId: 'group' })
    const item3 = createItem('item3', ItemType.InputNode, { portIds: ['port3'] })
    const item4 = createItem('item4', ItemType.OutputNode, { portIds: ['port4'] })
    const item5 = createItem('item5', ItemType.InputNode, { portIds: ['port5'] })
    const item6 = createItem('item6', ItemType.OutputNode, { portIds: ['port6'] })
    const chain2 = createConnectionChain('chain2', 'port3', 'port4', 2)
    const chain3 = createConnectionChain('chain3', 'port1', 'port2', 3)
    const chain4 = createConnectionChain('chain4', 'port1', 'port2', 3)
    const group = createGroup('group', ['item1', 'item2'], { isSelected: true })

    beforeEach(() => {
      store.$reset()
      store.$patch({
        items: {
          item1,
          item2,
          item3,
          item4,
          item5,
          item6,
          ...chain2.items,
          ...chain3.items,
          ...chain4.items
        },
        ports: {
          port1,
          port2,
          port3,
          port4,
          port5,
          port6,
          ...chain2.ports,
          ...chain3.ports,
          ...chain4.ports
        },
        connections: {
          ...chain2.connections,
          ...chain3.connections,
          ...chain4.connections
        },
        groups: {
          group
        },
        selectedItemIds: [
          'item1',
          'item2',
          'item3',
          'chain2Freeport1',
          ...Object.keys(chain3.items),
          ...Object.keys(chain4.items)
        ],
        selectedConnectionIds: [
          'chain2ConnectionSegment2',
          ...Object.keys(chain3.connections),
          ...Object.keys(chain4.connections)
        ]
      })

      jest
        .spyOn(window.api, 'setClipboardContents')
        .mockImplementation((data: string) => clipboardData = JSON.parse(data))

      store.copy()
    })

    it('should beep and not copy anything if no items are selected', () => {
      const store = createDocumentStore('document')()

      store.$patch({
        selectedItemIds: []
      })
      store.copy()

      expect(window.api.beep).toHaveBeenCalledTimes(1)
    })

    it('should invoke window.api.setClipboardContents()', () => {
      expect(window.api.setClipboardContents).toHaveBeenCalledTimes(1)
      expect(window.api.setClipboardContents).toHaveBeenCalledWith(JSON.stringify(clipboardData))
    })

    it('should contain the clipboard data structure', () => {
      expect(clipboardData).toHaveProperty('items')
      expect(clipboardData).toHaveProperty('ports')
      expect(clipboardData).toHaveProperty('connections')
      expect(clipboardData).toHaveProperty('groups')
      expect(clipboardData).toHaveProperty('pasteCount')
      expect(clipboardData.pasteCount).toEqual(1)
    })

    it('should copy all selected items', () => {
      expect(clipboardData.items).toHaveProperty('item1')
      expect(clipboardData.items).toHaveProperty('item2')
      expect(clipboardData.items).toHaveProperty('item3')
    })

    it('should not copy non-selected items', () => {
      expect(clipboardData.items).not.toHaveProperty('item4')
    })

    it('should copy all freeports of a chain that is connected to selected items at both ends', () => {
      expect(clipboardData.items).toHaveProperty('chain3Freeport1')
      expect(clipboardData.items).toHaveProperty('chain3Freeport2')
    })

    it('should not copy orphaned freeports', () => {
      expect(clipboardData.items).not.toHaveProperty('chain2Freeport1')
    })

    it('should copy all connections of a chain that is connected to selected items at both ends', () => {
      expect(clipboardData.connections).toHaveProperty('chain3ConnectionSegment1')
      expect(clipboardData.connections).toHaveProperty('chain3ConnectionSegment2')
      expect(clipboardData.connections).toHaveProperty('chain3ConnectionSegment3')
    })

    it('should not copy connections from a chain that is not connected to selected items at both ends', () => {
      expect(clipboardData.connections).not.toHaveProperty('chain2ConnectionSegment1')
      expect(clipboardData.connections).not.toHaveProperty('chain2ConnectionSegment2')
    })

    it('should copy the group of selected items', () => {
      expect(clipboardData.groups).toHaveProperty('group')
    })

    it('should beep if there are no valid items to copy', () => {
      const store = createDocumentStore('document')()
      const freeport = createItem('freeport', ItemType.Freeport, { isSelected: true })

      store.$patch({
        items: {
          freeport
        },
        selectedItemIds: ['freeport']
      })
      store.copy()

      expect(window.api.beep).toHaveBeenCalledTimes(1)
    })
  })

  describe('paste()', () => {
    const store = createDocumentStore('document')()
    const port1 = createPort('port1', 'item1', PortType.Output)
    const port2 = createPort('port2', 'item2', PortType.Input)
    const port3 = createPort('port3', 'item3', PortType.Output)
    const item1 = createItem('item1', ItemType.InputNode, { portIds: ['port1'] })
    const item2 = createItem('item2', ItemType.OutputNode, { portIds: ['port2'] })
    const item3 = createItem('item3', ItemType.InputNode, { portIds: ['port3'] })
    const connection1 = createConnection('connection1', 'port1', 'port2')
    const group = createGroup('group', ['item1', 'item3'])
    const clipboardData: ClipboardData = {
      items: {
        item1,
        item2,
        item3
      },
      ports: {
        port1,
        port2,
        port3
      },
      connections: {
        connection1
      },
      groups: {
        group
      },
      pasteCount: 3
    }

    beforeEach(() => {
      jest
        .spyOn(window.api, 'getClipboardContents')
        .mockReturnValue(JSON.stringify(clipboardData))
      jest
        .spyOn(idMapper, 'mapStandardCircuitIds')
        .mockImplementation(d => d)
      jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation(cb => {
          cb(0)
          return 0
        })

      stubAll(window.api, [
        'setClipboardContents',
        'beep'
      ])
      stubAll(store, [
        'commitState',
        'applyDeserializedState',
        'setSelectionState',
        'connect',
        'setGroupBoundingBox',
        'setSelectionState',
        'setSelectionPosition'
      ])
    })


    it('should beep and clear the clipboard if the data is invalid', () => {
      jest.clearAllMocks()
      jest
        .spyOn(window.api, 'getClipboardContents')
        .mockImplementation(() => {
          throw new Error('Invalid clipboard data')
        })

      store.paste()

      expect(window.api.clearClipboard).toHaveBeenCalledTimes(1)
      expect(window.api.beep).toHaveBeenCalledTimes(1)
    })

    describe('when the clipboard contains valid data', () => {
      beforeEach(() => store.paste())

      it('should assign all relevant ports to the state with reset values', () => {
        expect(store.ports).toHaveProperty('port1')
        expect(store.ports).toHaveProperty('port2')
        expect(store.ports).toHaveProperty('port3')
        expect(store.ports.port1.value).toBe(LogicValue.UNKNOWN)
        expect(store.ports.port2.isMonitored).toBe(false)
        expect(store.ports.port3.value).toBe(LogicValue.UNKNOWN)
        expect(store.ports.port1.isMonitored).toBe(false)
        expect(store.ports.port2.value).toBe(LogicValue.UNKNOWN)
        expect(store.ports.port3.isMonitored).toBe(false)
        expect(store.ports.port1).not.toHaveProperty('wave')
        expect(store.ports.port2).not.toHaveProperty('wave')
        expect(store.ports.port3).not.toHaveProperty('wave')
      })

      it('should invoke the ID mapper', () => {
        expect(idMapper.mapStandardCircuitIds).toHaveBeenCalledTimes(1)
        expect(idMapper.mapStandardCircuitIds).toHaveBeenCalledWith(clipboardData)
      })

      it('should commit the current undoable state', () => {
        expect(store.commitState).toHaveBeenCalledTimes(1)
      })

      it('should assign all ports with waves removed and values reset', () => {
        expect(store.applyDeserializedState).toHaveBeenCalledWith(expect.objectContaining({
          ports: expect.objectContaining({
            ...store.ports,
            ...Object
              .values(clipboardData.ports)
              .reduce((ports, port) => ({
                ...ports,
                [port.id]: expect.objectContaining({
                  ...port,
                  value: LogicValue.UNKNOWN,
                  isMonitored: false
                })
              }), {})
          })
        }))
      })

      it('should assign all items, connections, and groups from the clipboard to the state', () => {
        expect(store.applyDeserializedState).toHaveBeenCalledWith(
          expect.objectContaining({
            items: {
              ...store.items,
              ...clipboardData.items
            },
            connections: {
              ...store.connections,
              ...clipboardData.connections
            },
            groups: {
              ...store.groups,
              ...clipboardData.groups
            }
          })
        )
      })

      it('should select all added items, connections, and groups', () => {
        const ids = [
          ...Object.keys(clipboardData.items),
          ...Object.keys(clipboardData.connections),
          ...Object.keys(clipboardData.groups)
        ]

        expect(store.setSelectionState).toHaveBeenCalledTimes(ids.length)
        ids.forEach(id => {
          expect(store.setSelectionState).toHaveBeenCalledWith({
            id,
            value: true
          })
        })
      })

      it('should move the items 20 pixels right and down from the last paste', () => {
        const item = Object.values(clipboardData.items)[0]

        expect(store.setSelectionPosition).toHaveBeenCalledTimes(1)
        expect(store.setSelectionPosition).toHaveBeenCalledWith({
          id: item.id,
          position: {
            x: item.position.x + (clipboardData.pasteCount * 20),
            y: item.position.y + (clipboardData.pasteCount * 20)
          }
        })
      })

      it('should re-assign the clipboard data with `pasteCount` incremented', () => {
        // expect(window.api.setClipboardContents).toHaveBeenCalledTimes(1)
        expect(window.api.setClipboardContents).toHaveBeenCalledWith(JSON.stringify({
          ...clipboardData,
          pasteCount: clipboardData.pasteCount + 1
        }))
      })
    })

    it('should beep if data cannot be pasted', () => {
      jest.resetAllMocks()
      jest
        .spyOn(window.api, 'canPaste')
        .mockReturnValue(false)

      store.paste()

      expect(window.api.beep).toHaveBeenCalledTimes(1)
      expect(window.api.setClipboardContents).not.toHaveBeenCalled()
      expect(store.commitState).not.toHaveBeenCalled()
      expect(store.applyDeserializedState).not.toHaveBeenCalled()
    })
  })
})
