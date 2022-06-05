import { setActivePinia, createPinia } from 'pinia'
import { createDocumentStore } from '../..'

setActivePinia(createPinia())

describe('panning actions', () => {
  beforeEach(() => jest.restoreAllMocks())

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
