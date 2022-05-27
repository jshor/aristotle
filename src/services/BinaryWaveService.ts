import { LogicValue } from '@/circuit'

/**
 * @class BinaryWaveService
 * @description this service provides functionality for a graphical illustration of a wave in the oscilloscope.
 * Instances of these waves are the values of the active oscillogram.
 */
export default class BinaryWaveService implements Pulse {
  /** Wave ID. */
  public id: string

  /** User-friendly label for this wave. */
  public name: string

  /** Width (in pixels) of the wave. */
  public width: number = 0

  /** The y value for the last segment. */
  private lastY: number = 0

  /** Cartesian point values for each pixel segment. */
  public segments: Point[] = []

  /** Hue color value for the wave. */
  public hue: number = 0

  /**
   * Constructor.
   *
   * @param name - user-friendly label for this wave
   * @param signal - current signal value to initialize at
   * @param hue - color value for the wave
   */
  constructor (id: string, name: string, signal: number, hue: number) {
    this.id = id
    this.name = name
    this.hue = hue
    this.initialize(signal)
  }

  /**
   * Creates an initial segment based on the given signal.
   *
   * @param signal
   */
  public initialize = (signal: number) => {
    const segment = { x: 1, y: 1 }

    if (signal === 1) {
      segment.y = 0 // draw a vertical line from 0 up to 1
      this.lastY = 1
    } else {
      segment.y = 1 // draw a vertical line from 1 down to 0
      this.lastY = 0
    }

    this.addSegment(segment)
    this.updateWidth()
  }

  /**
   * Clears out the existing wave data.
   */
  public reset = () => {
    this.segments = []
    this.width = 0
    this.initialize(this.lastY === 1 ? 0 : 1)
  }

  /**
   * Periodic update function.
   *
   * @param elapsed - (no value necessary)
   */
  public update = (elapsed: number): void => {
    this.drawPulseConstant()
  }

  /**
   * Adds a new segment.
   * This will correct for any mismatches between the segment and the previous one (if any).
   *
   * @param segment - new segment to add
   */
  addSegment = (segment: Point) => {
    const previous = this.segments[this.segments.length - 1]

    if (!previous && segment.x > 0) {
      this.segments.push({ x: 0, y: segment.y })
    } else if (previous && previous.x !== segment.x && previous.y !== segment.y) {
      // if a previous segment exists, and both its x and y values mismatch, then remove it
      this.segments.pop()
    }

    this.segments.push(segment)
    this.updateWidth()
  }

  /**
   * Draws the next segment of the wave with an inverted signal line.
   *
   * @param signal - incoming signal change value
   */
  drawPulseChange = (signal: number) => {
    const { x } = this.segments[this.segments.length - 1]
    const y = signal === LogicValue.TRUE ? 0 : 1

    this.updateWidth()
    this.addSegment({ x, y })
  }

  /**
   * Draws the next segment of the wave, continued from the current signal line.
   */
  drawPulseConstant = () => {
    const previous = this.segments[this.segments.length - 1]
    // if the y value from the previous segment is unchanged, just extend its x value
    const pos = this.lastY !== previous.y
      ? previous
      : this.segments.pop()


    if (pos) {
      this.updateWidth()
      this.addSegment({
        x: pos.x + 1,
        y: pos.y
      })
    }
    this.lastY = previous.y
  }

  /**
   * Truncates the wave from the back such that the resulting wave is no wider than the given value.
   *
   * @param widthToKeep - the width, in pixels, to keep from the wave
   */
  truncateSegments = (widthToKeep: number) => {
    if (widthToKeep > this.width) {
      return
    }

    const widthToTruncate = this.width - widthToKeep

    let deltaX = 0

    for (let i = 0; i < this.segments.length; i++) {
      const { x, y } = this.segments[i]

      if (x > widthToTruncate) {
        deltaX = x - widthToTruncate

        this.segments.splice(0, i)
        this.segments.unshift({ x: 0, y })

        break
      }
    }

    for (let i = 1; i < this.segments.length; i++) {
      const { x, y } = this.segments[i]

      this.segments[i] = {
        x: x - widthToTruncate,
        y
      }
    }

    this.updateWidth()
  }

  updateWidth = () => {
    this.width = this.segments.slice(-1)[0]?.x || 0
  }
}
