import draw2d from 'draw2d'
import $ from 'jquery'

/**
 * Extends the draw2d Canvas to add user-friendly enhancements and support parent wrapper elements.
 *
 * @class Canvas
 * @extends draw2d.Canvas
 */
export default class Canvas extends draw2d.Canvas {

  createElement = (params: object, x: number, y: number): void => {}
}
