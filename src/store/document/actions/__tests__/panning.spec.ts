import { setActivePinia, createPinia } from 'pinia'
import { createDocumentStore } from '../..'
import { stubAll } from './__helpers__'

setActivePinia(createPinia())

vi.mock('@/constants', () => ({
  PANNING_FRICTION: 1,
  PANNING_SPEED: 1,
  PANNING_EASING_FUNCTION: (x: number) => x
}))

describe('panning actions', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('panTo', () => {
    it('should update the canvas to move to the given panning point', () => {
      const store = createDocumentStore('document')()

      store.canvas = {
        left: -200,
        top: -200,
        right: 703,
        bottom: 918
      }
      store.panTo({ x: 200, y: 18 })

      expect(store.canvas).toEqual({
        left: 200,
        top: 18,
        right: 1103,
        bottom: 1136
      })
    })
  })

  describe('panDelta', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      store.$reset()

      stubAll(store, ['setCanvasBoundingBox'])

      vi
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation(cb => {
          cb(0)
          return 0
        })
    })

    it('should directly apply the panning delta without momentum', () => {
      store.canvas = {
        left: -200,
        top: -200,
        right: 703,
        bottom: 918
      }
      store.panDelta({ x: 200, y: 18 })

      expect(store.setCanvasBoundingBox).toHaveBeenCalledTimes(1)
      expect(store.setCanvasBoundingBox).toHaveBeenCalledWith({
        left: 0,
        top: -182,
        right: 903,
        bottom: 936
      })
    })

    it('should ease the panning out using momentum as the distance traveled multiplied by friction', () => {
      store.canvas = {
        left: 0,
        top: 0,
        right: 1000,
        bottom: 1000
      }
      store.panDelta({ x: 3, y: 4 }, true) // magnitude of this vector is 5

      expect(store.setCanvasBoundingBox).toHaveBeenCalledTimes(5)
      expect(store.setCanvasBoundingBox).toHaveBeenNthCalledWith(1, {
        left: 0,
        top: 0,
        right: 1000,
        bottom: 1000
      })
      expect(store.setCanvasBoundingBox).toHaveBeenNthCalledWith(2, {
        left: 0.75,
        top: 1,
        right: 1000.75,
        bottom: 1001
      })
      expect(store.setCanvasBoundingBox).toHaveBeenNthCalledWith(3, {
        left: 1.5,
        top: 2,
        right: 1001.5,
        bottom: 1002
      })
      expect(store.setCanvasBoundingBox).toHaveBeenNthCalledWith(4, {
        left: 2.25,
        top: 3,
        right: 1002.25,
        bottom: 1003
      })
      expect(store.setCanvasBoundingBox).toHaveBeenNthCalledWith(5, {
        left: 3,
        top: 4,
        right: 1003,
        bottom: 1004
      })
    })
  })

  describe('panToCenter', () => {
    it('should pan to the center of the canvas', () => {
      const store = createDocumentStore('document')()

      store.canvas = {
        left: -200,
        top: -300,
        right: 4200,
        bottom: 1900
      }
      store.viewport = new DOMRect(20, 20, 200, 300)
      store.panToCenter()

      expect(store.canvas).toEqual({
        left: -2100,
        top: -950,
        right: 2300,
        bottom: 1250
      })
    })
  })

})
