import { createLocalVue, mount, shallowMount } from '@vue/test-utils'
import Draggable from '../../containers/Draggable.vue'
import Vuex from 'vuex'
import {
  getSnappedId,
  getSnappedPosition,
  screenToPoint
} from '../dragging'
import DragService from '../../../../services/DragService'

jest.mock('../../../../services/DragService')

const localVue = createLocalVue()

localVue.use(Vuex)

describe('Dragging Layout', () => {
  describe('screenToPoint()', () => {
    it('should return a point in Cartesian coordinates', () => {
      expect(screenToPoint({
        left: 10,
        top: 20
      })).toEqual({ x: 10, y: 20 })
    })
  })

  describe('getSnappedId()', () => {
    it('should return the id of the first element in the list of snapped elements', () => {
      // initialize a new DragService instance with a dummy component
      const dragService = new DragService(shallowMount({ template: '<div />' }).vm)
      const id1 = 'test-id-1'
      const id2 = 'test-id-2'

      jest
        .spyOn(dragService, 'getSnappedElements')
        .mockReturnValue([{
          item: {
            dataset: { id: id1 }
          }
        }, {
          item: {
            dataset: { id: id2 }
          }
        }])

      expect(getSnappedId(dragService)).toEqual(id1)
    })
  })

  describe('getSnappedPosition', () => {
    let component, dragService

    const canvas = {
      fromDocumentToEditorCoordinates: jest.fn(() => ({
        x: 0,
        y: 0
      }))
    }
    const threshold = 10

    beforeEach(() => {
      // create a dummy parent and have a Draggable component be its child
      const parent = mount({
        components: { Draggable },
        template: '<draggable />'
      }, {
        localVue,
        store: new Vuex.Store({
          getters: {
            zoom: () => 1
          }
        })
      })
      // create a dummy jQuery-draggable element
      const item = document.createElement('div') // NOTE: item is positioned at (0, 0)

      component = parent.vm.$children[0]

      // initialize a new DragService instance
      dragService = new DragService(component)
      dragService.component = component

      jest
        .spyOn(dragService, 'getSnappedElements')
        .mockReturnValue([{ item }])
    })

    describe('movement along the x-axis', () => {
      it('it should take on the snapped element x-coordinate if x is within the threshold', () => {
        const left = threshold - 1
        const top = threshold

        expect(getSnappedPosition(dragService, canvas, {
          left,
          top
        }, threshold)).toEqual({ left: 0, top })
      })

      it('it should maintain its existing x-coordinate if x is below the threshold', () => {
        const left = -threshold - 1
        const top = threshold

        expect(getSnappedPosition(dragService, canvas, {
          left,
          top
        }, threshold)).toEqual({ left, top })
      })

      it('it should maintain its existing x-coordinate if x is above the threshold', () => {
        const left = threshold + 1
        const top = threshold

        expect(getSnappedPosition(dragService, canvas, {
          left,
          top
        }, threshold)).toEqual({ left, top })
      })

      it('it should maintain its existing x-coordinate if x is exactly equal to the threshold', () => {
        const left = threshold
        const top = threshold

        expect(getSnappedPosition(dragService, canvas, {
          left,
          top
        }, threshold)).toEqual({ left, top })
      })
    })

    describe('movement along the y-axis', () => {
      it('it should take on the snapped element y-coordinate if y is within the threshold', () => {
        const left = threshold
        const top = threshold - 1

        expect(getSnappedPosition(dragService, canvas, {
          left,
          top
        }, threshold)).toEqual({ left, top: 0 })
      })

      it('it should maintain its existing y-coordinate if y is below the threshold', () => {
        const left = threshold
        const top = -threshold - 1

        expect(getSnappedPosition(dragService, canvas, {
          left,
          top
        }, threshold)).toEqual({ left, top })
      })

      it('it should maintain its existing y-coordinate if y is above the threshold', () => {
        const left = threshold
        const top = threshold + 1

        expect(getSnappedPosition(dragService, canvas, {
          left,
          top
        }, threshold)).toEqual({ left, top })
      })

      it('it should maintain its existing y-coordinate if y is exactly equal to the threshold', () => {
        const left = threshold
        const top = threshold

        expect(getSnappedPosition(dragService, canvas, {
          left,
          top
        }, threshold)).toEqual({ left, top })
      })
    })

    describe('both x- and y-axes', () => {
      it('it should take on the snapped element x- and y-coordinates if both x and y are within the threshold', () => {
        const left = threshold - 1
        const top = threshold - 1

        expect(getSnappedPosition(dragService, canvas, {
          left,
          top
        }, threshold)).toEqual({ left: 0, top: 0 })
      })
    })
  })
})
