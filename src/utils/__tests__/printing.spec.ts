import domToImage from 'dom-to-image-more'
import printing from '../printing'

vi.mock('dom-to-image-more')

const sampleImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=='

describe('Printing utility', () => {
  const zoom = 1
  const editor = document.createElement('div')

  editor.appendChild(document.createElement('div'))

  beforeEach(() => {
    vi
      .spyOn(domToImage, 'toPng')
      .mockResolvedValue(sampleImg)
  })

  afterEach(() => vi.resetAllMocks())

  describe('printWindow()', () => {
    beforeEach(() => {
      vi
        .spyOn(window, 'addEventListener')
        .mockImplementation((_, fn) => setTimeout(fn as Function))
      vi
        .spyOn(window, 'print')
        .mockImplementation(vi.fn())

      vi.useFakeTimers()
    })

    afterEach(() => vi.useRealTimers())

    it('should print the window contents', async () => {
      const promise = printing.printWindow(window)

      vi.advanceTimersByTime(10)

      await promise

      expect(window.print).toHaveBeenCalledTimes(1)
    })

    it('should not invoke print if no window object is passed', async () => {
      const promise = printing.printWindow(null)

      vi.advanceTimersByTime(10)

      await promise

      expect(window.print).not.toHaveBeenCalled()
    })
  })

  describe('printImage()', () => {
    let printFrameSpy: vi.SpyInstance

    beforeEach(() => {
      printFrameSpy = vi.spyOn(printing, 'createPrintFrame')
      vi
        .spyOn(printing, 'printWindow')
        .mockResolvedValue()
    })

    afterEach(() => {
      document.body.innerHTML = ''
    })

    it('should attach the rendered image to the printable iframe', async () => {
      await printing.printImage(editor, {
        left: 100,
        right: 200,
        top: 100,
        bottom: 150
      }, {})

      const [ image, pageSize ] = printFrameSpy.mock.calls[0]

      expect(image).toEqual(expect.any(HTMLImageElement))
      expect(image.src).toEqual(sampleImg)
      expect(image.style.width).toEqual('140px')
      expect(image.style.height).toEqual('90px')
      expect(pageSize).toEqual([8.5, 11])
    })

    it('should resize the image in ratio to fit the window size', async () => {
      await printing.printImage(editor, {
        left: 4000,
        right: 5000,
        top: 4000,
        bottom: 5500
      }, {})

      const [ image, pageSize ] = printFrameSpy.mock.calls[0]

      expect(image).toEqual(expect.any(HTMLImageElement))
      expect(image.src).toEqual(sampleImg)
      expect(image.style.width).toEqual('713px')
      expect(image.style.height).toEqual('1056px')
      expect(pageSize).toEqual([8.5, 11])
    })

    it('should attach a portrait image to the printable iframe when the height exceeds the width', async () => {
      await printing.printImage(editor, {
        left: 4000,
        right: 5500,
        top: 4000,
        bottom: 5000
      }, {})

      const [ image, pageSize ] = printFrameSpy.mock.calls[0]

      expect(image).toEqual(expect.any(HTMLImageElement))
      expect(image.src).toEqual(sampleImg)
      expect(image.style.width).toEqual('1056px')
      expect(image.style.height).toEqual('713px')
      expect(pageSize).toEqual([11, 8.5])
    })
  })
})
