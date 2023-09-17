import { setActivePinia, createPinia } from 'pinia'
import ItemType from '@/types/enums/ItemType'
import { createItem } from './__helpers__'
import { createDocumentStore } from '../..'
import BoundingBox from '@/types/types/BoundingBox'

setActivePinia(createPinia())

describe('snapping actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('setSnapBoundaries', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()
    })

    it('should not apply any snap boundaries for an item that does not exist', () => {
      store.setSnapBoundaries('some-bogus-item-id')

      expect(store.snapBoundaries).toEqual([])
    })

    it('should not apply any snap boundaries for grouped items', () => {
      const item1 = createItem('item1', ItemType.LogicGate, { groupId: 'group1' })

      store.$patch({
        items: { item1 }
      })
      store.setSnapBoundaries(item1.id)

      expect(store.snapBoundaries).toEqual([])
    })

    describe('when the item is not part of any group', () => {
      const bbox1: BoundingBox = { left: 1, top: 2, right: 3, bottom: 4 }
      const bbox2: BoundingBox = { left: 5, top: 6, right: 7, bottom: 8 }
      const bbox3: BoundingBox = { left: 9, top: 10, right: 11, bottom: 12 }

      beforeEach(() => {
        const item1 = createItem('item1', ItemType.LogicGate, { boundingBox: bbox1 })
        const item2 = createItem('item2', ItemType.LogicGate, { boundingBox: bbox2 })
        const item3 = createItem('item3', ItemType.LogicGate, { boundingBox: bbox3 })

        store.$patch({
          items: { item1, item2, item3 }
        })
        store.setSnapBoundaries(item3.id)
      })

      it('should not apply the bounding box of the item being dragged', () => {
        expect(store.snapBoundaries).toEqual(expect.not.arrayContaining([bbox3]))
      })

      it('should apply the bounding boxes of all snappable items', () => {
        expect(store.snapBoundaries).toEqual(expect.arrayContaining([bbox1, bbox2]))
      })
    })
  })
})
