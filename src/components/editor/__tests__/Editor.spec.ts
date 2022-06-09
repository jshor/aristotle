import boundaries from '@/store/document/geometry/boundaries'
import { mount, VueWrapper } from '@vue/test-utils'
import { ComponentPublicInstance } from 'vue'
import Editor from '../Editor.vue'

describe('Editor component', () => {
  let wrapper: VueWrapper<ComponentPublicInstance<typeof Editor>>

  const width = 1000
  const height = 1500
  const gridSize = 20
  const zoom = 1
  const offset: Point = {
    x: 10,
    y: 22
  }

  beforeEach(() => {
    wrapper = mount(Editor, {
      props: {
        width,
        height,
        gridSize,
        zoom,
        offset
      }
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.useRealTimers()
  })

  describe('style', () => {
    it('should apply the styles according to the props provided', async () => {
      expect(wrapper.vm.style).toEqual(expect.objectContaining({
        backgroundSize: `${gridSize}px ${gridSize}px`,
        transform: `scale(${zoom})`,
        left: `${offset.x}px`,
        top: `${offset.y}px`,
        width: `${width}px`,
        height: `${height}px`,
      }))
    })

    it('should default to the origin point offset', async () => {
      await wrapper.setProps({
        offset: {
          x: 0,
          y: 0
        }
      })

      expect(wrapper.vm.style).toEqual(expect.objectContaining({
        left: '0px',
        top: '0px'
      }))
    })
  })

  describe('when the mouse pans the canvas', () => {
    const x = 13
    const y = 21
    const deltaX = 5
    const deltaY = 10

    beforeEach(async () => {
      await wrapper.trigger('mousedown', { x, y, button: 2 })
    })

    it('should emit `pan` with the movement deltas when the canvas is panned', () => {
      window.dispatchEvent(new MouseEvent('mousemove', {
        clientX: x + deltaX,
        clientY: y + deltaY
      }))

      expect(wrapper.emitted()).toHaveProperty('pan')
      expect(wrapper.emitted().pan[0]).toEqual([{
        x: expect.any(Number),
        y: expect.any(Number)
      }])
    })

    describe('when the mouse is released', () => {
      beforeEach(() => {
        jest.useFakeTimers()

        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: x + deltaX,
          clientY: y + deltaY
        }))
      })

      it('should continue to pan with momentum once the mouse is released', () => {
        jest
          .spyOn(boundaries, 'isInNeighborhood')
          .mockReturnValue(false)

        window.dispatchEvent(new MouseEvent('mouseup', {
          clientX: x + deltaX,
          clientY: y + deltaY,
          button: 2
        }))

        jest.advanceTimersByTime(1000)

        expect(wrapper.emitted()).toHaveProperty('pan')
        expect(wrapper.emitted().pan.length).toBeGreaterThan(1)
      })

      it('should emit `contextmenu` when the mouse has not moved 5 or more pixels', () => {
        jest
          .spyOn(boundaries, 'isInNeighborhood')
          .mockReturnValue(true)

        window.dispatchEvent(new MouseEvent('mouseup', {
          clientX: x + deltaX,
          clientY: y + deltaY,
          button: 2
        }))

        expect(wrapper.emitted()).toHaveProperty('contextmenu')
      })

      it('should not emit `contextmenu` when the mouse has moved more than 5 pixels', () => {
        jest
          .spyOn(boundaries, 'isInNeighborhood')
          .mockReturnValue(false)

        window.dispatchEvent(new MouseEvent('mouseup', {
          clientX: x + deltaX,
          clientY: y + deltaY,
          button: 2
        }))

        expect(wrapper.emitted()).not.toHaveProperty('contextmenu')
      })
    })
  })

  describe('when the mouse wheel moves', () => {
    it('should not zoom when the shift key is not held down', async () => {
      await wrapper
        .find('.editor')
        .trigger('mousewheel', {
          deltaY: -20,
          shiftKey: false,
          x: 10,
          y: 20
        })

      expect(wrapper.emitted()).not.toHaveProperty('zoom')
    })

    it('should zoom in when scrolled in the negative direction', async () => {
      await wrapper
        .find('.editor')
        .trigger('mousewheel', {
          deltaY: -20,
          shiftKey: true,
          x: 10,
          y: 20
        })

      expect(wrapper.emitted()).toHaveProperty('zoom')
      expect(wrapper.emitted().zoom[0]).toEqual([{
        zoom: 1.1,
        point: {
          x: 10,
          y: 20
        }
      }])
    })

    it('should zoom out when scrolled in the positive direction', async () => {
      await wrapper
        .find('.editor')
        .trigger('mousewheel', {
          deltaY: 20,
          shiftKey: true,
          x: 10,
          y: 20
        })

      expect(wrapper.emitted()).toHaveProperty('zoom')
      expect(wrapper.emitted().zoom[0]).toEqual([{
        zoom: 0.9,
        point: {
          x: 10,
          y: 20
        }
      }])
    })
  })

  describe('when the editor is touched', () => {
    it('should not emit `deselect` when an element other than the selector is touched', async () => {
      await wrapper
        .find('.editor')
        .trigger('touchend', {
          changedTouches: [new TouchEvent('touchend')]
        })

        expect(wrapper.emitted()).not.toHaveProperty('deselect')
    })

    it('should emit `deselect` when the finger has moved substantially', async () => {
      await wrapper
        .findComponent({ name: 'Selector' })
        .trigger('touchend', {
          changedTouches: [new TouchEvent('touchend')]
        })

      expect(wrapper.emitted()).toHaveProperty('deselect')
    })

    it('should emit `zoom` when two fingers pinch the editor', async () => {
      const editor = await wrapper.find('.editor')
      const trigger = (e: 'touchstart' | 'touchmove' | 'touchend') => editor.trigger(e, {
        touches: [
          new TouchEvent(e),
          new TouchEvent(e)
        ],
        changedTouches: [
          new TouchEvent(e),
          new TouchEvent(e)
        ],
        targetTouches: [
          new TouchEvent(e),
          new TouchEvent(e)
        ]
      })

      await trigger('touchstart')
      await trigger('touchmove')
      await trigger('touchend')

      expect(wrapper.emitted()).toHaveProperty('zoom')
    })

    it('should pan when only one touch is present', async () => {
      const editor = await wrapper.find('.editor')
      const trigger = (e: 'touchstart' | 'touchmove' | 'touchend') => editor.trigger(e, {
        touches: [
          new TouchEvent(e)
        ],
        changedTouches: [
          new TouchEvent(e)
        ],
        targetTouches: [
          new TouchEvent(e)
        ]
      })

      await trigger('touchstart')
      await trigger('touchmove')
      await trigger('touchend')

      expect(wrapper.emitted()).toHaveProperty('pan')
    })
  })

  describe('when selection changes', () => {
    it('should emit `deselect` when the shift key is not held down', async () => {
      await wrapper
        .findComponent({ name: 'Selector' })
        .vm.$emit('selection-start', { ctrlKey: false })

      expect(wrapper.emitted()).toHaveProperty('deselect')
    })

    it('should emit `selection` when the selection is terminated', async () => {
      await wrapper
        .findComponent({ name: 'Selector' })
        .vm.$emit('selection-end', { ctrlKey: false })

      expect(wrapper.emitted()).toHaveProperty('selection')
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
