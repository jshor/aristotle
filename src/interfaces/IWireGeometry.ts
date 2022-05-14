export default interface IWireGeometry {
  /**
   * The SVG path instructions.
   *
   * @type {string}
   */
  path: string

  /**
   * The width of the wire SVG.
   *
   * @type {number}
   */
  width: number

  /**
   * The height of the wire SVG.
   *
   * @type {number}
   */
  height: number

  /**
   * The left x-axis value of the wire SVG.
   *
   * @type {number}
   */
  minX: number

  /**
   * The top y-axis value of the wire SVG.
   *
   * @type {number}
   */
  minY: number
}
