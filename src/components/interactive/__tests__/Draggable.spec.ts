import boundaries from '@/store/document/geometry/boundaries'
import { mount, VueWrapper } from '@vue/test-utils'
import { ComponentPublicInstance } from 'vue'
import Draggable from '../Draggable.vue'
import { TOUCH_LONG_HOLD_TIMEOUT } from '@/constants'

describe('Draggable component', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mount(Draggable)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetAllMocks()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('when the element is focused', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation(cb => {
          cb(1)
          return 0
        })
    })

    it('should emit `select`', async () => {
      await wrapper.setProps({ isSelected: false })
      await wrapper.trigger('focus')

      vi.advanceTimersByTime(10)

      expect(wrapper.emitted()).toHaveProperty('select')
      expect(wrapper.emitted().select[0]).toEqual([true])
    })
  })

  describe('when applying mouse events', () => {
    beforeEach(() => {
      vi
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation(cb => {
          cb(1)
          return 0
        })
    })

    describe('when the mouse drags the item', () => {
      const x = 13
      const y = 21
      const deltaX = 5
      const deltaY = 10

      beforeEach(async () => {
        await wrapper.trigger('mousedown', { x, y })
      })

      it('should emit `dragStart` with the movement deltas and pointer offset', async () => {
        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: x + deltaX,
          clientY: y + deltaY
        }))

        expect(wrapper.emitted()).toHaveProperty('dragStart')
        expect(wrapper.emitted().dragStart[0]).toEqual([{
          x: x + deltaX,
          y: y + deltaY
        }, { x: 0, y: 0 }])
      })

      it('should emit `dragStart` when the horizontal position changes', async () => {
        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: x + deltaX,
          clientY: y
        }))

        expect(wrapper.emitted()).toHaveProperty('dragStart')
      })

      it('should emit `dragStart` when the vertical position changes', async () => {
        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: x,
          clientY: y + deltaY
        }))

        expect(wrapper.emitted()).toHaveProperty('dragStart')
      })

      it('should emit `drag` after subsequent drags', async () => {
        await window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: x + deltaX + 1,
          clientY: y + deltaY + 1
        }))
        await window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: x + deltaX + 2,
          clientY: y + deltaY + 2
        }))

        expect(wrapper.emitted()).toHaveProperty('drag')
        expect(wrapper.emitted().drag[0]).toEqual([{
          x: x + deltaX + 2,
          y: y + deltaY + 2
        }, { x: 0, y: 0 }])
      })

      it('should emit `dragEnd` with the last position when the mouse button is released', async () => {
        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: x + deltaX,
          clientY: y + deltaY
        }))
        window.dispatchEvent(new MouseEvent('mouseup'))

        expect(wrapper.emitted()).toHaveProperty('dragEnd')
        expect(wrapper.emitted().dragEnd[0]).toEqual([{
          x: x + deltaX,
          y: y + deltaY
        }, { x: 0, y: 0 }])
      })

      it('should emit `select` when the mouse is down', async () => {
        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: x + deltaX,
          clientY: y + deltaY
        }))

        await wrapper.trigger('mouseup', { x, y })

        expect(wrapper.emitted()).toHaveProperty('select')
      })
    })

    it('should not emit any events if the position is unchanged', async () => {
      wrapper = mount(Draggable)

      await wrapper.trigger('mousedown', { x: 0, y: 0 })

      window.dispatchEvent(new MouseEvent('mousemove', {
        clientX: 0,
        clientY: 0
      }))

      expect(wrapper.emitted()).not.toHaveProperty('drag')
      expect(wrapper.emitted()).not.toHaveProperty('dragStart')
      expect(wrapper.emitted()).not.toHaveProperty('dragEnd')
    })

    it('should not emit drag events when the mouse moves without having mousedown on the element first', async () => {
      wrapper = mount(Draggable)

      window.dispatchEvent(new MouseEvent('mousemove'))

      expect(wrapper.emitted()).not.toHaveProperty('drag')
      expect(wrapper.emitted()).not.toHaveProperty('dragStart')
      expect(wrapper.emitted()).not.toHaveProperty('dragEnd')
    })

    it.skip('should focus the element when selected', async () => {
      const { element } = wrapper.find('.draggable')
      const spy = vi.spyOn(element as HTMLElement, 'focus')

      await wrapper.setProps({ isSelected: true })

      expect(spy).toHaveBeenCalled()
    })
  })

  describe('when using touch gestures', () => {
    const getTouchEvent = (clientX: number, clientY: number): Touch => ({ clientX, clientY }) as Touch

    it('should emit `touchhold` after being held down in the same place for more than the long touch-hold timeout', async () => {
      vi.useFakeTimers()

      await wrapper.trigger('touchstart', {
        touches: [new TouchEvent('touchstart')]
      })

      vi.advanceTimersByTime(TOUCH_LONG_HOLD_TIMEOUT + 1)

      expect(wrapper.emitted()).toHaveProperty('touchhold')
    })

    describe('when the element is dragged', () => {
      const x = 10
      const y = 20

      beforeEach(async () => {
        vi.useFakeTimers()
        vi
          .spyOn(window, 'requestAnimationFrame')
          .mockImplementation(cb => {
            cb(1)
            return 0
          })

        await wrapper.trigger('touchstart', {
          touches: [getTouchEvent(x, y)]
        })
      })

      it('should not allow `touchhold` to be emitted once the position has moved substantially', async () => {
        vi
          .spyOn(boundaries, 'isInNeighborhood')
          .mockReturnValue(false)

        await wrapper.trigger('touchmove', {
          touches: [getTouchEvent(x, y)]
        })

        vi.advanceTimersByTime(TOUCH_LONG_HOLD_TIMEOUT + 1)

        expect(wrapper.emitted()).not.toHaveProperty('touchhold')
      })

      it('should permit `touchhold` to be emitted when the item does not move substantially', async () => {
        vi
          .spyOn(boundaries, 'isInNeighborhood')
          .mockReturnValue(true)

        await wrapper.trigger('touchmove', {
          touches: [getTouchEvent(x, y)]
        })

        vi.advanceTimersByTime(TOUCH_LONG_HOLD_TIMEOUT + 1)

        expect(wrapper.emitted()).toHaveProperty('touchhold')
      })

      it('should emit `dragStart`', async () => {
        await wrapper.trigger('touchmove', {
          touches: [getTouchEvent(x + 10, y + 10)]
        })

        expect(wrapper.emitted()).toHaveProperty('dragStart')
      })

      it('should emit `drag` after subsequent drags', async () => {
        await wrapper.trigger('touchmove', {
          touches: [getTouchEvent(x, y)]
        })
        await wrapper.trigger('touchmove', {
          touches: [getTouchEvent(x + 10, y + 10)]
        })
        await wrapper.trigger('touchmove', {
          touches: [getTouchEvent(x + 20, y + 20)]
        })

        expect(wrapper.emitted()).toHaveProperty('drag')
      })

      it('should emit `dragEnd` with the last position when the touch finger is released', async () => {
        await wrapper.trigger('touchmove', {
          touches: [new TouchEvent('touchmove')]
        })
        await wrapper.trigger('touchend', {
          touches: [new TouchEvent('touchend')]
        })

        expect(wrapper.emitted()).toHaveProperty('dragEnd')
      })

      it('should not emit drag events when allowTouchDrag is false', async () => {
        await wrapper.setProps({ allowTouchDrag: false })
        await wrapper.trigger('touchmove', {
          touches: [getTouchEvent(x, y)]
        })
        await wrapper.trigger('touchmove', {
          touches: [getTouchEvent(x + 10, y + 10)]
        })
        await wrapper.trigger('touchend', {
          touches: [new TouchEvent('touchend')]
        })

        expect(wrapper.emitted()).not.toHaveProperty('dragStart')
        expect(wrapper.emitted()).not.toHaveProperty('drag')
        expect(wrapper.emitted()).not.toHaveProperty('dragEnd')
      })
    })

    describe('when movement is insubstantial', () => {
      const x = 10
      const y = 20

      beforeEach(async () => {
        await wrapper.trigger('touchend', {
          touches: [getTouchEvent(x, y)]
        })
      })

      it('should not emit `dragEnd`when the touch finger is released', async () => {
        expect(wrapper.emitted()).not.toHaveProperty('dragEnd')
      })

      it('should emit `select`', async () => {
        expect(wrapper.emitted()).toHaveProperty('select')
      })

      it('should emit `deselect` when the item is selected', async () => {
        await wrapper.setProps({ isSelected: true })
        await wrapper.trigger('touchend', {
          touches: [getTouchEvent(x, y)]
        })
        expect(wrapper.emitted()).toHaveProperty('deselect')
      })
    })
  })

  describe('when the component is destroyed', () => {
    it('should remove the mousemove and mouseup methods', async () => {
      const spy = vi.spyOn(window, 'removeEventListener')

      await wrapper.unmount()

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(spy).toHaveBeenCalledWith('mouseup', expect.any(Function))
    })
  })
})
