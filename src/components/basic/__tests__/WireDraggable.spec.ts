import { mount, VueWrapper } from '@vue/test-utils'
import WireDraggable from '../WireDraggable.vue'
import { createControlPoint } from '@/store/document/actions/__tests__/__helpers__'
import boundaries from '@/store/document/geometry/boundaries'
import renderLayout from '@/store/document/geometry/wire'
import { TOUCH_SHORT_HOLD_TIMEOUT } from '@/constants'

describe('Draggable wire component', () => {
  let wrapper: VueWrapper<typeof WireDraggable>

  beforeEach(() => {
    wrapper = mount(WireDraggable, {
      props: {
        geometry: renderLayout(createControlPoint(), createControlPoint())
      }
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

  describe('when using touch gestures', () => {
    const getTouchEvent = (clientX: number, clientY: number): Touch => ({ clientX, clientY }) as Touch

    it('should emit `add` to add a control point after being held down in the same place for more than the short touch-hold timeout', async () => {
      jest.useFakeTimers()

      await wrapper
        .find('[data-test="wire-clickable"]')
        .trigger('touchstart', {
          touches: [new TouchEvent('touchstart')]
        })

      jest.advanceTimersByTime(TOUCH_SHORT_HOLD_TIMEOUT + 1)

      expect(wrapper.emitted()).toHaveProperty('add')
    })

    describe('when the element is dragged', () => {
      const x = 10
      const y = 20

      beforeEach(async () => {
        jest.useFakeTimers()
        jest
          .spyOn(window, 'requestAnimationFrame')
          .mockImplementation(cb => {
            cb(1)
            return 0
          })

        await wrapper
          .find('[data-test="wire-clickable"]')
          .trigger('touchstart', {
            touches: [getTouchEvent(x, y)]
          })
      })

      it('should not emit `add` when the movement is not substantial', async () => {
        jest
          .spyOn(boundaries, 'isInNeighborhood')
          .mockReturnValue(false)

        await wrapper
          .find('[data-test="wire-clickable"]')
          .trigger('touchmove', {
            touches: [getTouchEvent(x, y)]
          })

        jest.advanceTimersByTime(TOUCH_SHORT_HOLD_TIMEOUT + 1)

        expect(wrapper.emitted()).not.toHaveProperty('add')
      })

      it('should emit `add` when the movement is substantial', async () => {
        jest
          .spyOn(boundaries, 'isInNeighborhood')
          .mockReturnValue(true)

        await wrapper
          .find('[data-test="wire-clickable"]')
          .trigger('touchmove', {
            touches: [getTouchEvent(x, y)]
          })

        jest.advanceTimersByTime(TOUCH_SHORT_HOLD_TIMEOUT + 1)

        expect(wrapper.emitted()).toHaveProperty('add')
      })

      it('should emit `add`', async () => {
        await wrapper
          .find('[data-test="wire-clickable"]')
          .trigger('touchmove', {
            touches: [getTouchEvent(x + 10, y + 10)]
          })

        expect(wrapper.emitted()).toHaveProperty('add')
      })

      it('should emit `move` after subsequent drags', async () => {
        await wrapper
          .find('[data-test="wire-clickable"]')
          .trigger('touchmove', {
            touches: [getTouchEvent(x, y)]
          })
        await wrapper
          .find('[data-test="wire-clickable"]')
          .trigger('touchmove', {
            touches: [getTouchEvent(x + 10, y + 10)]
          })
        await wrapper
          .find('[data-test="wire-clickable"]')
          .trigger('touchmove', {
            touches: [getTouchEvent(x + 20, y + 20)]
          })

        expect(wrapper.emitted()).toHaveProperty('move')
      })

      it('should emit `added` with the last position when the touch finger is released', async () => {
        await wrapper
          .find('[data-test="wire-clickable"]')
          .trigger('touchmove', {
            touches: [new TouchEvent('touchmove')]
          })
        await wrapper
          .find('[data-test="wire-clickable"]')
          .trigger('touchend', {
            touches: [new TouchEvent('touchend')]
          })

        expect(wrapper.emitted()).toHaveProperty('added')
      })
    })

    describe('when movement is insubstantial', () => {
      const x = 10
      const y = 20

      beforeEach(async () => {
        await wrapper
          .find('[data-test="wire-clickable"]')
          .trigger('touchend', {
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
        await wrapper
          .find('[data-test="wire-clickable"]')
          .trigger('touchend', {
            touches: [getTouchEvent(x, y)]
          })
        expect(wrapper.emitted()).toHaveProperty('deselect')
      })
    })
  })

  describe('when the component is destroyed', () => {
    it('should remove the mousemove and mouseup methods', async () => {
      const spy = jest.spyOn(window, 'removeEventListener')

      await wrapper.unmount()

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(spy).toHaveBeenCalledWith('mouseup', expect.any(Function))
    })
  })
})
