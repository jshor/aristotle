import { setActivePinia, createPinia } from 'pinia'
import boundaries from '../../geometry/boundaries'
import ItemType from '@/types/enums/ItemType'
import {
  createConnection,
  createControlPoint,
  createGroup,
  createItem,
  stubAll
} from './__helpers__'
import { createDocumentStore } from '../..'
import BoundingBox from '@/types/types/BoundingBox'

setActivePinia(createPinia())

describe('sizing actions', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('updateCanvasSize', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, [
        'centerAll',
        'panToCenter'
      ])
    })

    describe('when the bounding box surrounding the items exceeds the viewport dimensions', () => {
      const boundingBox = {
        left: 0,
        top: 0,
        right: 1000,
        bottom: 1000
      }

      beforeEach(() => {
        vi
          .spyOn(boundaries, 'getGroupBoundingBox')
          .mockReturnValue(boundingBox)

        store.$patch({
          items: {
            item1: createItem('item1', ItemType.InputNode)
          }
        })
        store.updateCanvasSize()
      })

      it('should update the canvas size to be twice the dimensions of the bounding box', () => {
        expect(store.canvas).toEqual({
          left: 0,
          top: 0,
          right: 2000,
          bottom: 2000
        })
      })

      it('should center all items', () => {
        expect(store.centerAll).toHaveBeenCalledTimes(1)
      })

      it('should pan to the center of the canvas', () => {
        expect(store.panToCenter).toHaveBeenCalledTimes(1)
      })

      it('should zoom to fit all items on the screen', () => {
        const boundingBox = {
          left: 0,
          top: 0,
          right: 750,
          bottom: 750
        }

        vi
          .spyOn(boundaries, 'getGroupBoundingBox')
          .mockReturnValue(boundingBox)
        vi.useFakeTimers()

        store.$patch({
          items: {
            item1: createItem('item1', ItemType.InputNode)
          },
          canvas: {
            left: 0,
            top: 0,
            right: 1000,
            bottom: 1000
          },
          viewport: {
            width: 500,
            height: 500
          }
        })
        store.updateCanvasSize()
        vi.runAllTimers()

        expect(store.zoomLevel).toEqual(0.67)

        vi.useRealTimers()
      })
    })
  })

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

    it('should not do anything if the item does not exist', () => {
      vi.resetAllMocks()
      store.setItemSize({ id: 'item-does-not-exist', rect })

      expect(store.setItemBoundingBox).not.toHaveBeenCalled()
      expect(store.setGroupBoundingBox).not.toHaveBeenCalled()
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
      vi.spyOn(boundaries, 'getBoundingBox')

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

      vi
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
      vi.spyOn(boundaries, 'getGroupBoundingBox')

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

      vi
        .spyOn(boundaries, 'getGroupBoundingBox')
        .mockReturnValue(boundingBox)

      store.setGroupBoundingBox(group1.id)

      expect(store.groups[group1.id].boundingBox).toEqual(boundingBox)
    })

    it('should include control points in the bounding box', () => {
      const connection1 = createConnection('connection1', 'a', 'b', {
        controlPoints: [
          createControlPoint({
            position: {
              x: 30,
              y: 20
            }
          }),
          createControlPoint({
            position: {
              x: 80,
              y: 70
            }
          })
        ]
      })
      const group = createGroup('group', [], {
        connectionIds: ['connection1']
      })

      store.$patch({
        connections: { connection1 },
        groups: { group },
        selectedControlPoints: {
          connection1: new Set([0, 1])
        }
      })

      store.setGroupBoundingBox(group.id)

      expect(store.groups[group.id].boundingBox).toEqual({
        left: 30,
        top: 20,
        right: 80,
        bottom: 70
      })
    })
  })
})
