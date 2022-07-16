import { setActivePinia, createPinia } from 'pinia'
import boundaries from '../../geometry/boundaries'
import ItemType from '@/types/enums/ItemType'
import {
  createGroup,
  createItem,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'

setActivePinia(createPinia())

describe('sizing actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('setViewerSize', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'centerAll',
        'panToCenter'
      ])
    })

    it('should canvas size according to the screen size', () => {
      const rect = new DOMRect(10, 20, 100, 200)

      store.setViewerSize(rect)

      expect(store.viewport).toEqual(rect)
      expect(store.canvas.right).toEqual(screen.width / 0.1)
      expect(store.canvas.bottom).toEqual(screen.height / 0.1)
    })

    it('should pan and center items when the dimensions are set and the document has not yet loaded', () => {
      store.setViewerSize(new DOMRect(10, 20, 100, 200))

      expect(store.hasLoaded).toEqual(true)
      expect(store.centerAll).toHaveBeenCalledTimes(1)
      expect(store.panToCenter).toHaveBeenCalledTimes(1)
    })

    it('should not pan or center items when the document has already loaded', () => {
      store.hasLoaded = true
      store.setViewerSize(new DOMRect(10, 20, 100, 200))

      expect(store.centerAll).not.toHaveBeenCalled()
      expect(store.panToCenter).not.toHaveBeenCalled()
    })

    it('should not pan or center items when the width is not defined', () => {
      store.setViewerSize(new DOMRect(0, 0, 0, 0))

      expect(store.centerAll).not.toHaveBeenCalled()
      expect(store.panToCenter).not.toHaveBeenCalled()
    })

    it('should not pan or center items when the height is not defined', () => {
      store.setViewerSize(new DOMRect(10, 0, 100, 0))

      expect(store.centerAll).not.toHaveBeenCalled()
      expect(store.panToCenter).not.toHaveBeenCalled()
    })
  })

  describe('setItemSize', () => {
    const store = createDocumentStore('document')()
    const rect = new DOMRect(120, 120, 120, 120)
    const id = 'item1'
    const item1 = createItem(id, ItemType.InputNode, {
      width: 60,
      height: 60,
      position: {
        x: 120,
        y: 120
      }
    })

    beforeEach(() => {
      store.$reset()
      store.items = { item1 }
      store.zoomLevel = 1.5

      stubAll(store, [
        'setItemBoundingBox',
        'setGroupBoundingBox'
      ])

      store.setItemSize({ id, rect })
    })

    it('should re-position the item with respect to its center', () => {
      expect(store.items.item1.position).toEqual({ x: 110, y: 110 })
    })

    it('should update the dimensions with the current zoom according to the dimensions provided', () => {
      expect(store.items.item1.width).toEqual(80)
      expect(store.items.item1.height).toEqual(80)
    })

    it('should update the item\'s bounding box', () => {
      expect(store.setItemBoundingBox).toHaveBeenCalledTimes(1)
      expect(store.setItemBoundingBox).toHaveBeenCalledWith(id)
    })

    it('should update the group bounding box if the item belongs to one', () => {
      const groupId = 'group-id'
      const item2 = createItem('item2', ItemType.InputNode, { groupId })

      store.items = { item2 }
      store.setItemSize({ rect, id: 'item2' })

      expect(store.setGroupBoundingBox).toHaveBeenCalledTimes(1)
      expect(store.setGroupBoundingBox).toHaveBeenCalledWith(groupId)
    })
  })

  describe('setItemBoundingBox', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
    })

    it('should not compute a new bounding box if the item does not exist', () => {
      jest.spyOn(boundaries, 'getBoundingBox')

      store.setItemBoundingBox('item1')

      expect(boundaries.getBoundingBox).not.toHaveBeenCalled()
    })

    it('should set the bounding box according to the one computed', () => {
      const boundingBox: BoundingBox = {
        left: 12,
        top: 42,
        right: 100,
        bottom: 231
      }
      const item1 = createItem('item1', ItemType.LogicGate)

      jest
        .spyOn(boundaries, 'getBoundingBox')
        .mockReturnValue(boundingBox)

      store.$patch({
        items: { item1 }
      })
      store.setItemBoundingBox(item1.id)

      expect(store.items[item1.id].boundingBox).toEqual(boundingBox)
    })
  })

  describe('setGroupBoundingBox', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
    })

    it('should not compute a new bounding box if the group does not exist', () => {
      jest.spyOn(boundaries, 'getGroupBoundingBox')

      store.setGroupBoundingBox('group1')

      expect(boundaries.getGroupBoundingBox).not.toHaveBeenCalled()
    })

    it('should set the bounding box according to the one computed', () => {
      const boundingBox: BoundingBox = {
        left: 12,
        top: 42,
        right: 100,
        bottom: 231
      }
      const item1 = createItem('item1', ItemType.LogicGate)
      const group1 = createGroup('group1', ['item1'])

      store.$patch({
        items: { item1 },
        groups: { group1 }
      })

      jest
        .spyOn(boundaries, 'getGroupBoundingBox')
        .mockReturnValue(boundingBox)

      store.setGroupBoundingBox(group1.id)

      expect(store.groups[group1.id].boundingBox).toEqual(boundingBox)
    })
  })
})
