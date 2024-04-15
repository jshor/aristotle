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

  it('should render an animated wire when desired', async () => {
    await wrapper.setProps({ isAnimated: true })

    expect(wrapper.find('.wire__animation').exists()).toBe(true)
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

    describe('when tapped and dragged', () => {
      const clientX = 10
      const clientY = 20
      const $event = {
        touches: [getTouchEvent(clientX, clientY)],
        stopPropagation: jest.fn()
      } as unknown as TouchEvent

      describe('adding ports', () => {
        beforeEach(() => {
          wrapper.vm.onTouched($event, false)
        })

        it('should not emit `add`', () => {
          expect(wrapper.emitted()).not.toHaveProperty('add')
        })

        it('should emit `add` with the given position and offset', () => {
          const position = { x: 10, y: 20 }
          const offset = { x: 1, y: 2 }

          wrapper.vm.onDragStart(position, offset)

          expect(wrapper.emitted()).toHaveProperty('add')
          expect(wrapper.emitted('add')).toHaveLength(1)
          expect(wrapper.emitted('add')![0]).toEqual([position, offset])
        })

        it('should not stop event propagation', () => {
          wrapper.vm.onTouchDrag($event)

          expect($event.stopPropagation).not.toHaveBeenCalled()
        })
      })

      it('should emit `select` when the wire is not selected', async () => {
        await wrapper.setProps({ isSelected: false })
        wrapper.vm.onTouched($event, false)

        expect(wrapper.emitted()).toHaveProperty('select')
      })

      it('should emit `deselect` when the wire is selected', async () => {
        await wrapper.setProps({ isSelected: true })
        wrapper.vm.onTouched($event, false)

        expect(wrapper.emitted()).toHaveProperty('deselect')
      })
    })

    describe('when held down', () => {
      const clientX = 10
      const clientY = 20
      const $event = {
        touches: [getTouchEvent(clientX, clientY)],
        stopPropagation: jest.fn()
      } as unknown as TouchEvent

      beforeEach(() => {
        wrapper.vm.onTouched($event, true)
      })

      it('should emit `add` with the position held', () => {
        expect(wrapper.emitted()).toHaveProperty('add')
        expect(wrapper.emitted('add')).toHaveLength(1)
        expect(wrapper.emitted('add')![0]).toEqual([{
          x: clientX,
          y: clientY
        }, { x: 0, y: 0 }])
      })

      it('should not emit `add` again afterwards when dragging has started', () => {
        wrapper.vm.onDragStart({ x: 10, y: 20 }, { x: 0, y: 0 })

        expect(wrapper.emitted('add')).toHaveLength(1)
      })

      it('should stop event propagation while dragging', () => {
        wrapper.vm.onTouchDrag($event)

        expect($event.stopPropagation).toHaveBeenCalled()
      })
    })

    describe('when left mouse is down', () => {
      it('should emit `select` when the wire is not selected', async () => {
        await wrapper.setProps({ isSelected: false })
        await wrapper
          .find('[data-test="wire-clickable"]')
          .trigger('mousedown', { clientX: 10, clientY: 20 })

        expect(wrapper.emitted()).toHaveProperty('select')
      })

      it('should not emit `select` when the wire is selected', async () => {
        await wrapper.setProps({ isSelected: true })
        await wrapper
          .find('[data-test="wire-clickable"]')
          .trigger('mousedown', { clientX: 10, clientY: 20 })

        expect(wrapper.emitted()).not.toHaveProperty('select')
      })
    })
  })

  describe('on dragging', () => {
    it('should emit `move`', () => {
      wrapper.vm.onDrag({ x: 10, y: 20 })

      expect(wrapper.emitted()).toHaveProperty('move')
      expect(wrapper.emitted('move')).toHaveLength(1)
      expect(wrapper.emitted('move')![0]).toEqual([{ x: 10, y: 20 }])
    })
  })

  describe('when dragging is complete', () => {
    it('should emit `added`', () => {
      wrapper.vm.onDragEnd()

      expect(wrapper.emitted()).toHaveProperty('added')
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
