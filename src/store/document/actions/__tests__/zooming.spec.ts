import { setActivePinia, createPinia } from 'pinia'
import { createDocumentStore } from '../..'

setActivePinia(createPinia())

describe('zooming actions', () => {
  beforeEach(() => jest.restoreAllMocks())

  describe('incrementZoom', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      jest
        .spyOn(store, 'setZoom')
        .mockImplementation(jest.fn())
    })

    it('should decrement the zoom by one scale measure', () => {
      store.incrementZoom(-1)

      expect(store.setZoom).toHaveBeenCalledTimes(1)
      expect(store.setZoom).toHaveBeenCalledWith({ zoom: 0.9 })
    })

    it('should increment the zoom by one scale measure', () => {
      store.incrementZoom()

      expect(store.setZoom).toHaveBeenCalledTimes(1)
      expect(store.setZoom).toHaveBeenCalledWith({ zoom: 1.1 })
    })
  })

  describe('setZoom', () => {
    const store = createDocumentStore('document')()

    beforeEach(() => {
      jest
        .spyOn(store, 'panTo')
        .mockImplementation(jest.fn())

      store.$reset()
      store.zoomLevel = 1
      store.canvas = {
        left: -100,
        right: -300,
        top: -150,
        bottom: 150
      }
      store.viewport = new DOMRect(100, 50, 300, 250)
    })

    it('should pan to the center of the viewport when a focal point is not defined', () => {
      store.setZoom({ zoom: 1.1 })

      expect(store.panTo).toHaveBeenCalledTimes(1)
      expect(store.panTo).toHaveBeenCalledWith({ x: -100, y: -160 })
    })

    it('should pan to the document-oriented focal point', () => {
      store.setZoom({
        zoom: 1.1,
        point: {
          x: 104,
          y: 117
        }
      })

      expect(store.panTo).toHaveBeenCalledTimes(1)
      expect(store.panTo).toHaveBeenCalledWith({ x: -110, y: -172 })
    })

    it('should set the zoom level to the minimum possible when the desired zoom is below it', () => {
      store.setZoom({ zoom: 0.05 })

      expect(store.zoomLevel).toEqual(0.1)
    })

    it('should set the zoom level to the maximum possible when the desired zoom exceeds it', () => {
      store.setZoom({ zoom: 2.05 })

      expect(store.zoomLevel).toEqual(2)
    })
  })

})
