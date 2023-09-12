import BoundingBox from '@/types/types/BoundingBox'
import domToImage from 'dom-to-image'

/**
 * Renders a printer-friendly HTML DOM clone of the given editor element.
 *
 * @param zoom - current zoom level of the document
 * @param editor - the editor DOM element to clone
 * @param boundingBox - the bounding box of all items in the editor
 * @param padding - number of pixels to use as surrounding padding
 */
function createPrintArea (zoom: number, editor: HTMLElement, boundingBox: BoundingBox, padding: number, className: string = 'printer-friendly') {
  const printArea = editor.cloneNode(true) as HTMLElement
  const width = boundingBox.right - boundingBox.left + (padding * 2)
  const height = boundingBox.bottom - boundingBox.top + (padding * 2)

  for (let i = 0; i < printArea.children.length; i++) {
    const child = printArea.children[i] as HTMLElement
    const left = parseInt(child.style.left.replace('px', ''), 10) + padding
    const top = parseInt(child.style.top.replace('px', ''), 10) + padding

    child.style.left = `${(left - boundingBox.left)}px`
    child.style.top = `${(top - boundingBox.top)}px`
  }

  printArea.style['zoom' as any] = zoom.toString()
  printArea.style.width = `${width}px`
  printArea.style.height = `${height}px`
  printArea.style.position = 'relative'
  printArea.style.top = '0'
  printArea.style.left = '0'
  printArea.style.background = 'none'

  if (className) {
    printArea.classList.add(className)
  }

  return { printArea, width, height }
}

/**
 * Renders a hidden iframe on the page for printing.
 *
 * @param image - the image to print
 * @param pageSize - list of [width, height] dimensions, in inches
 */
function createPrintFrame (image: HTMLImageElement, pageSize: number[]) {
  const iframe = document.createElement('iframe')

  iframe.name = 'print'
  iframe.style.width = '1px'
  iframe.style.height = '1px'
  iframe.style.opacity = '0'
  iframe.style.position = 'absolute'
  iframe.style.top = '0px'
  iframe.style.left = '0px'

  document.body.appendChild(iframe)

  const printFrame = iframe.contentWindow

  if (printFrame) {
    const styleTag = document.createElement('style')

    styleTag.appendChild(document.createTextNode(`
      @page {
        size: ${pageSize.map(s => `${s}in`).join(' ')};
        margin: 0in;
      }
    `))

    printFrame.document.head.append(styleTag)
    printFrame.document.body.appendChild(image)
  }

  return iframe
}

/**
 * Renders a binary PNG screenshot of the given HTML element.
 *
 * @param printArea
 */
async function createImage<T extends string | Blob> (printArea: HTMLElement, fn: 'toBlob' | 'toPng') {
  document.body.appendChild(printArea)

  const dataUrl = await domToImage[fn](printArea) as T

  printArea.remove()

  return dataUrl
}

/**
 * Prints (using a physical printer) the contents of the given window.
 */
async function printWindow (win: Window | null) {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      if (!win) return resolve()

      win.addEventListener('afterprint', () => resolve())
      win.print()
    })
  })
}

/**
 * Prints (using a physical printer) the editor.
 * The version printed will be rendered as a printer-friendly (read: ink-friendly) screenshot of the given editor.
 *
 * @param zoom - current zoom level of the document
 * @param editor - the editor DOM element to clone
 * @param boundingBox - the bounding box of all items in the editor
 */
async function printImage (zoom: number, editor: HTMLElement, boundingBox: BoundingBox) {
  const { printArea, width, height } = createPrintArea(1 / zoom, editor, boundingBox, 20)
  const dataUrl = await printing.createImage<string>(printArea, 'toPng')
  const pageSize = [8.5, 11] // inches
  const minSize = Math.min(...pageSize) * 96 // pixels
  const maxSize = Math.max(...pageSize) * 96 // pixels
  const image = new Image()

  let percent = 1 // percentage to resize the image by (to fit printable window area)

  image.src = dataUrl as string

  if (width > minSize || width > maxSize || height > minSize || height > maxSize) {
    // make the image print in either landscape or portrait, whichever fits better
    const isLandscape = width > height

    // if the image exceeds one of the dimensions, resize it in ratio to match the dimension
    percent = isLandscape
      ? maxSize / width
      : maxSize / height

    if (isLandscape) {
      pageSize.reverse()
    }
  }

  image.style.width = `${Math.floor(width * percent)}px`
  image.style.height = `${Math.floor(height * percent)}px`

  const iframe = printing.createPrintFrame(image, pageSize)

  await printing.printWindow(iframe?.contentWindow)

  iframe?.remove()
}

const printing = {
  createPrintArea,
  createPrintFrame,
  createImage,
  printImage,
  printWindow
}

export default printing
