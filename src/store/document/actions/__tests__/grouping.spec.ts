import { setActivePinia, createPinia } from 'pinia'
import ItemType from '@/types/enums/ItemType'
import {
  createConnection,
  createGroup,
  createItem,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'

setActivePinia(createPinia())

describe('grouping/ungrouping actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('group', () => {
    const store = createDocumentStore('document')()

    let groupId: string

    beforeEach(() => {
      const item1 = createItem('item1', ItemType.LogicGate, { isSelected: true, zIndex: 1 })
      const item2 = createItem('item2', ItemType.LogicGate, { groupId: 'group1', isSelected: true, zIndex: 2, portIds: ['port3', 'port4'] })
      const item3 = createItem('item3', ItemType.LogicGate, { isSelected: false, zIndex: 3 })
      const connection1 = createConnection('connection1', 'port1', 'port2', { isSelected: true, zIndex: 4 })
      const connection2 = createConnection('connection2', 'port3', 'port4', { groupId: 'group1', isSelected: true, zIndex: 5 })
      const connection3 = createConnection('connection3', 'port5', 'port6', { isSelected: false, zIndex: 6 })

      stubAll(store, [
        'commitState',
        'setZIndex',
        'destroyGroup',
        'setGroupBoundingBox'
      ])

      store.$reset()
      store.$patch({
        items: { item1, item2 , item3 },
        connections: { connection1, connection2, connection3 }
      })
      store.group()

      groupId = Object.keys(store.groups)[0]
    })

    it('should destroy the groups of any selected items for which they are a member of', () => {
      expect(store.destroyGroup).toHaveBeenCalledWith('group1')
    })

    it('should set the zIndex of the selected items to the highest one among them', () => {
      expect(store.setZIndex).toHaveBeenCalledWith(5)
    })

    it('should only group items and connections that are selected and whose ports are entirely belonging to items in the group', () => {
      expect(store.groups[groupId]).toEqual(expect.objectContaining({
        id: groupId,
        itemIds: ['item1', 'item2'],
        connectionIds: ['connection2'],
        isSelected: true
      }))
    })

    it('should set the bounding box of the new group', () => {
      expect(store.setGroupBoundingBox).toHaveBeenCalledWith(groupId)
    })

    it('should set all groupIds of all items specified in the group to its ID', () => {
      expect(store.items.item1.groupId).toEqual(groupId)
      expect(store.items.item2.groupId).toEqual(groupId)
    })
  })

  describe('ungroup', () => {
    const store = createDocumentStore('document')()
    const group1 = createGroup('group1', [], { isSelected: true })
    const group2 = createGroup('group2', [], { isSelected: false })

    beforeEach(() => {
      stubAll(store, [
        'commitState',
        'destroyGroup'
      ])

      store.$reset()
      store.$patch({
        groups: { group1, group2 }
      })
      store.ungroup()
    })

    it('should commit the undo-able state', () => {
      expect(store.commitState).toHaveBeenCalled()
    })

    it('should destroy a selected group', () => {
      expect(store.destroyGroup).toHaveBeenCalledWith('group1')
    })

    it('should not destroy groups that are not selected', () => {
      expect(store.destroyGroup).not.toHaveBeenCalledWith('group2')
    })
  })


  describe('destroyGroup', () => {
    const store = createDocumentStore('document')()

    let item1: Item
    let item2: Item
    let connection1: Connection
    let connection2: Connection
    let group: Group

    const groupId = 'group-id'

    beforeEach(() => {
      item1 = createItem('item1', ItemType.Buffer, { groupId })
      item2 = createItem('item2', ItemType.Buffer, { groupId })
      connection1 = createConnection('connection1', 'port1', 'port2', { groupId })
      connection2 = createConnection('connection2', 'port3', 'port4', { groupId })
      group = createGroup(groupId, ['item1', 'item2'], {
        connectionIds: ['connection1', 'connection2']
      })

      store.$reset()
      store.$patch({
        items: { item1, item2 },
        connections: { connection1, connection2 },
        groups: { [groupId]: group }
      })

      store.destroyGroup(groupId)
    })

    it('should remove the group from the state', () => {
      expect(store.groups).not.toHaveProperty(groupId)
    })

    it('should set all groupIds of all items specified in the group to null', () => {
      expect(store.items.item1.groupId).toBeNull()
      expect(store.items.item2.groupId).toBeNull()
    })

    it('should set all groupIds of all connections specified in the group to null', () => {
      expect(store.connections.connection1.groupId).toBeNull()
      expect(store.connections.connection2.groupId).toBeNull()
    })
  })
})
