import SnapMode from '@/types/enums/SnapMode'
import { shallowMount, VueWrapper } from '@vue/test-utils'
import { ComponentPublicInstance } from 'vue'
import Draggable from '../Draggable.vue'

describe('Draggable', () => {
  const boundingBox = {
    left: 20,
    top: 30,
    right: 40,
    bottom: 50
  }
  const position = {
    x: boundingBox.left,
    y: boundingBox.top
  }
  let wrapper: VueWrapper<ComponentPublicInstance<typeof Draggable>>

  beforeEach(() => {
    wrapper = shallowMount(Draggable, {
      props: {
        boundingBox,
        position
      }
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    wrapper.unmount()
  })

  describe('when the bounding box moves', () => {
    const initialPosition = { x: 10, y: 20 }
    const boundingBox = {
      left: 1,
      top: 2,
      right: 3,
      bottom: 4
    }

    beforeEach(() => {
      wrapper = shallowMount(Draggable)
    })

    it('should reset the apparent position when not dragging', async () => {
      await wrapper.setData({ initialPosition, isDragging: false })
      await wrapper.setProps({ boundingBox })

      expect(wrapper.vm.apparentPosition).toEqual(initialPosition)
    })

    it('should not change the apparent position when dragging', async () => {
      await wrapper.setData({ initialPosition, isDragging: true })
      await wrapper.setProps({ boundingBox })

      expect(wrapper.vm.apparentPosition).toEqual({ x: 0, y: 0 })
    })
  })

  describe('initDragging()', () => {
    const x = 10
    const y = 14

    describe('when the element is draggable', () => {

      beforeEach(async () => {
        await wrapper.setProps({ isDraggable: true })

        wrapper.vm.initDragging(x, y)
      })

      it('should set the mouse position to the provided value', () => {
        expect(wrapper.vm.mousePosition).toEqual({ x, y })
      })

      it('should update the apparent position to the provided value', () => {
        expect(wrapper.vm.apparentPosition).toEqual(wrapper.vm.initialPosition)
      })
    })

    it('should not change the mouse position if the item is not draggable', async () => {
      const mousePosition = {
        x: 100,
        y: 200
      }

      await wrapper.setProps({ isDraggable: false })
      await wrapper.setData({ mousePosition })

      wrapper.vm.initDragging(x, y)

      expect(wrapper.vm.mousePosition).toEqual(mousePosition)
    })
  })

  describe('getScaledDelta()', () => {
    it('should return the scaled point of the given mouse event', async () => {
      const zoom = 1.3
      const $event = new MouseEvent('mousemove')

      await wrapper.setProps({ zoom })

      expect(wrapper.vm.getScaledDelta($event)).toEqual({
        x: ($event.x - wrapper.vm.mousePosition.x) / zoom,
        y: ($event.y - wrapper.vm.mousePosition.y) / zoom,
      })
    })
  })

  describe('keydown()', () => {
    describe('when the user is dragging', () => {
      beforeEach(() => wrapper.vm.initDragging(0, 0))

      it('should halt dragging and reset its position if the user interrupts it with CTRL + Z', () => {
        wrapper.vm.keydown(new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true
        }))

        expect(wrapper.vm.isDragging).toBe(false)
        expect(wrapper.vm.initialPosition).toEqual(position)
      })

      it('should not halt dragging if the user just hits Z', () => {
        wrapper.vm.keydown(new KeyboardEvent('keydown', {
          key: 'z'
        }))

        expect(wrapper.vm.isDragging).toBe(true)
      })
    })

    it('should not halt dragging if the user is not dragging anything', () => {
      wrapper.vm.keydown(new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true
      }))

      expect(wrapper.vm.isDragging).toBe(false)
    })
  })

  describe('mousedown()', () => {
    const $event = new MouseEvent('mousemove')

    beforeEach(() => {
      jest.spyOn($event, 'preventDefault')
      jest.spyOn($event, 'stopPropagation')
      jest
        .spyOn(wrapper.vm, 'initDragging')
        .mockImplementation(jest.fn())

      wrapper.vm.mousedown($event)
    })

    it('should prevent default behavior', () => {
      expect($event.preventDefault).toHaveBeenCalledTimes(1)
      expect($event.stopPropagation).toHaveBeenCalledTimes(1)
    })

    it('should invoke initDragging() with the event client position', () => {
      expect(wrapper.vm.initDragging).toHaveBeenCalledTimes(1)
      expect(wrapper.vm.initDragging).toHaveBeenCalledWith($event.clientX, $event.clientY)
    })
  })

  describe('mousemove', () => {
    const $event = new MouseEvent('mousemove')
    const delta = { x: 10, y: 13 }

    describe('when the element is both draggable and currently dragging', () => {
      beforeEach(async () => {
        await wrapper.setData({ isDragging: true })
        await wrapper.setProps({ isDraggable: true })

        jest
          .spyOn(wrapper.vm, 'getScaledDelta')
          .mockReturnValue(delta)
      })

      it('should emit `dragStart`', () => {
        wrapper.vm.mousemove($event)
        expect(wrapper.emitted()).toHaveProperty('dragStart')
      })

      it('should snap to an available boundary point when in its radial neighborhood', async () => {
        await wrapper.setProps({
          snapMode: SnapMode.Radial,
          snapBoundaries: [{
            left: 15,
            top: 11,
            bottom: 100,
            right: 100
          }]
        })

        wrapper.vm.mousemove($event)

        expect(wrapper.emitted()).toHaveProperty('drag')
        expect(wrapper.emitted().drag[0]).toEqual([{ x: 15, y: 11 }])
      })

      it('should emit its true dragged position when there is nothing within its radius to snap to', async () => {
        await wrapper.setProps({
          snapMode: SnapMode.Radial,
          snapBoundaries: []
        })

        wrapper.vm.mousemove($event)

        expect(wrapper.emitted()).toHaveProperty('drag')
        expect(wrapper.emitted().drag[0]).toEqual([{ x: 30, y: 43 }])
      })

      it('should round to the nearest grid distance in grid snap mode', async () => {
        await wrapper.setProps({
          snapMode: SnapMode.Grid,
          snapDistance: 20
        })

        wrapper.vm.mousemove($event)

        expect(wrapper.emitted()).toHaveProperty('drag')
        expect(wrapper.emitted().drag[0]).toEqual([{ x: 20, y: 20 }])
      })

      it('should snap to an available boundary line when in its linear neighborhood', async () => {
        await wrapper.setProps({
          snapMode: SnapMode.Outer,
          snapBoundaries: [{
            left: 15,
            top: 30,
            bottom: 100,
            right: 100
          }]
        })

        wrapper.vm.mousemove($event)

        expect(wrapper.emitted()).toHaveProperty('drag')
        expect(wrapper.emitted().drag[0]).toEqual([{ x: 30, y: 43 }])
      })
    })

    it('should not emit `dragStart` if the element is not being dragged', async () => {
      await wrapper.setData({ isDragging: false })
      await wrapper.setProps({ isDraggable: true })

      wrapper.vm.mousemove($event)

      expect(wrapper.emitted()).not.toHaveProperty('dragStart')
    })

    it('should not emit `dragStart` if the element is not draggable', async () => {
      await wrapper.setData({ isDragging: true })
      await wrapper.setProps({ isDraggable: false })

      wrapper.vm.mousemove($event)

      expect(wrapper.emitted()).not.toHaveProperty('dragStart')
    })
  })

  describe('mouseup()', () => {
    const $event = new MouseEvent('mouseup')
    const delta = { x: 30, y: 43 }

    describe('when the item is draggable', () => {
      beforeEach(async () => {
        await wrapper.setProps({ isDragging: true })
        await wrapper.setProps({ isDraggable: true })

        jest
          .spyOn(wrapper.vm, 'getScaledDelta')
          .mockReturnValue(delta)

        wrapper.vm.mouseup($event)
      })

      it('should emit `dragEnd` with the scaled delta', () => {
        expect(wrapper.emitted()).toHaveProperty('dragEnd')
        expect(wrapper.emitted().dragEnd[0]).toEqual([{ delta }])
      })

      it('should set `isDragging` to false', () => {
        expect(wrapper.vm.isDragging).toBe(false)
      })

      it('should reset the initial position to the augmented prop position', () => {
        expect(wrapper.vm.initialPosition).toEqual(wrapper.vm.clonedPosition)
      })
    })

    it('should not emit `dragEnd` if the element is not draggable', async () => {
      await wrapper.setProps({ isDraggable: false })

      wrapper.vm.mouseup($event)

      expect(wrapper.emitted()).not.toHaveProperty('dragStart')
    })
  })
})
