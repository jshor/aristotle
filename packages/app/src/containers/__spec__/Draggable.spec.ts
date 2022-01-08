import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import Draggable from '../Draggable.vue'
import DragService from '../../services/DragService'

jest.mock('../../services/DragService')
jest.mock('../../layout/dragging')
jest.mock('../../utils/getAncestor', () => () => ({
  fromDocumentToEditorCoordinates () {
    return { x: 10, y: 20 }
  }
}))

describe('Document Container', () => {
  let wrapper

  const event = {...new MouseEvent('mousemove')}
  const ui = {
    originalPosition: {
      x: 0,
      y: 0
    },
    position: {
      x: 0,
      y: 0
    }
  }

  event.clientX = 10
  event.clientY = 20

  const createWrapper = (props = {}) => {
    return shallowMount(Draggable, {
      props,
      global: {
        plugins: [
          createStore({
            getters: {
              zoom: () => 1
            }
          })
        ]
      }
    })
  }

  it('should initialize a new dragging service instance with callback methods', () => {
    const spy = jest
      .spyOn(DragService.prototype, 'createDrag')
      .mockImplementation(jest.fn())

    wrapper = createWrapper()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      start: wrapper.vm.onDragStart,
      drag: wrapper.vm.onDrag,
      stop: wrapper.vm.onDragEnd
    }))
  })

  describe('onDragStart()', () => {
    beforeEach(() => {
      wrapper = createWrapper()

      jest
        .spyOn(wrapper.vm, 'updatePosition')
        .mockImplementation(jest.fn())

      wrapper.vm.onDragStart(event, ui)
    })

    it('should set the mouse coordinates to the ones in the MouseEvent', () => {
      expect(wrapper.vm.mouse).toEqual({ x: 10, y: 20 })
    })

    it('should call updatePosition()', () => {
      expect(wrapper.vm.updatePosition).toHaveBeenCalledTimes(1)
      expect(wrapper.vm.updatePosition).toHaveBeenCalledWith(event, ui)
    })

    it('should emit `dragStart` with `position` specifying Cartesian canvas coordinates', () => {
      expect(wrapper.emitted()).toHaveProperty('dragStart')
      expect(wrapper.emitted().dragStart[0][0]).toHaveProperty('position')
    })
  })

  describe('onDrag()', () => {
    beforeEach(() => {
      wrapper = createWrapper()

      jest
        .spyOn(wrapper.vm, 'updatePosition')
        .mockImplementation(jest.fn())

      wrapper.vm.onDrag(event, ui)
    })

    it('should call updatePosition()', () => {
      expect(wrapper.vm.updatePosition).toHaveBeenCalledTimes(1)
      expect(wrapper.vm.updatePosition).toHaveBeenCalledWith(event, ui)
    })

    it('should emit `drag` with `position` specifying Cartesian canvas coordinates', () => {
      expect(wrapper.emitted()).toHaveProperty('drag')
      expect(wrapper.emitted().drag[0][0]).toHaveProperty('position')
    })
  })

  describe('onDragEnd()', () => {
    beforeEach(() => {
      wrapper = createWrapper()
      wrapper.vm.onDragEnd(event, ui)
    })

    it('should emit `dragEnd` with `position` specifying Cartesian canvas coordinates and the `snappedId`', () => {
      expect(wrapper.emitted()).toHaveProperty('dragEnd')
      expect(wrapper.emitted().dragEnd[0][0]).toHaveProperty('position')
      expect(wrapper.emitted().dragEnd[0][0]).toHaveProperty('snappedId')
    })
  })
})
