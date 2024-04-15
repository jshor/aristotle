import boundaries from '@/store/document/geometry/boundaries'
import { mount, VueWrapper } from '@vue/test-utils'
import { ComponentPublicInstance } from 'vue'
import Editor from '../Editor.vue'
import { PANNING_FRICTION } from '@/constants'
import Point from '@/types/interfaces/Point'

describe('Editor component', () => {
  let wrapper: VueWrapper

  const width = 1000
  const height = 1500
  const gridSize = 20
  const zoom = 1
  const offset: Point = {
    x: 10,
    y: 22
  }
  const props = {
    gridSize,
    zoom,
    canvas: {
      left: offset.x,
      top: offset.y,
      right: offset.x + width,
      bottom: offset.y + height
    }
  }

  beforeEach(() => {
    wrapper = mount(Editor, { props })

    vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(cb => {
        cb(1)
        return 0
      })
  })

  afterEach(() => {
    vi.resetAllMocks()
    vi.restoreAllMocks()
  })

  describe('style', () => {
    it('should apply the styles according to the props provided', async () => {
      expect((wrapper.vm as any).style).toEqual(expect.objectContaining({
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
        canvas: {
          ...props.canvas,
          left: 0,
          top: 0
        }
      })

      expect((wrapper.vm as any).style).toEqual(expect.objectContaining({
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
        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: x + deltaX,
          clientY: y + deltaY
        }))
      })

      it.skip('should continue to pan with momentum in the same direction once the mouse is released', async() => {
        window.dispatchEvent(new MouseEvent('mouseup', {
          clientX: x + deltaX,
          clientY: y + deltaY
        }))

        expect(wrapper.emitted()).toHaveProperty('pan')

        const magnitude = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))
        const angle = Math.atan2(deltaY, deltaX)
        const result = wrapper.emitted().pan[1] as Point[]

        expect(Math.ceil(result[0].x)).toEqual(Math.ceil(magnitude * Math.cos(angle) * PANNING_FRICTION))
        expect(Math.ceil(result[0].y)).toEqual(Math.ceil(magnitude * Math.sin(angle) * PANNING_FRICTION))
        expect((wrapper.emitted().pan[1] as any)[1]).toBe(true)
      })

      it('should not continue panning if no user-directed panning occurred', async() => {
        wrapper = mount(Editor, { props })

        window.dispatchEvent(new MouseEvent('mouseup', {
          clientX: x,
          clientY: y
        }))

        expect(wrapper.emitted()).not.toHaveProperty('pan')
      })

      it('should emit `contextmenu` when the mouse has not moved 5 or more pixels using right click', () => {
        vi
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
        vi
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
    it('should not zoom when the ctrl key is not held down', async () => {
      await wrapper
        .find('.editor')
        .trigger('mousewheel', {
          deltaY: -20,
          ctrlKey: false,
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
          ctrlKey: true,
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
          ctrlKey: true,
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

    it('should not zoom when deltaY has not changed', async () => {
      await wrapper
        .find('.editor')
        .trigger('mousewheel', {
          deltaY: 0,
          ctrlKey: true,
          x: 10,
          y: 20
        })

      expect(wrapper.emitted()).not.toHaveProperty('zoom')
    })
  })

  describe('when the editor is touched', () => {
    it('should not emit `pan` when an element other than the editor is touched', async () => {
      await wrapper
        .find('.editor')
        .trigger('touchend', {
          changedTouches: [new TouchEvent('touchend')]
        })

        expect(wrapper.emitted()).not.toHaveProperty('pan')
    })

    it('should not emit any events when more than two fingers are used', async () => {
      const editor = await wrapper.find('.editor')
      const getTouch = (clientX: number, clientY: number) => ({
        clientX,
        clientY
      }) as Touch

      const trigger = (e: 'touchstart' | 'touchmove' | 'touchend') => editor.trigger(e, {
        touches: [
          getTouch(10, 10),
          getTouch(20, 20),
          getTouch(30, 30)
        ],
        changedTouches: [
          getTouch(10, 10),
          getTouch(20, 20),
          getTouch(30, 30)
        ],
        targetTouches: [
          getTouch(10, 10),
          getTouch(20, 20),
          getTouch(30, 30)
        ]
      })

      await trigger('touchstart')
      await trigger('touchmove')
      await trigger('touchend')

      expect(wrapper.emitted()).not.toHaveProperty('zoom')
      expect(wrapper.emitted()).not.toHaveProperty('pan')
    })

    it('should emit `zoom` and `pan` when two fingers pinch the editor', async () => {
      const editor = await wrapper.find('.editor')
      const getTouch = (clientX: number, clientY: number) => ({
        clientX,
        clientY
      }) as Touch

      const trigger = (e: 'touchstart' | 'touchmove' | 'touchend') => editor.trigger(e, {
        touches: [
          getTouch(10, 10),
          getTouch(20, 20)
        ],
        changedTouches: [
          getTouch(10, 10),
          getTouch(20, 20)
        ],
        targetTouches: [
          getTouch(10, 10),
          getTouch(20, 20)
        ]
      })

      await trigger('touchstart')
      await trigger('touchmove')
      await trigger('touchend')

      expect(wrapper.emitted()).toHaveProperty('zoom')
      expect(wrapper.emitted()).toHaveProperty('pan')
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
