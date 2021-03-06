import { LogicValue } from '@aristotle/logic-circuit'
import IPulse from '../interfaces/IPulse'
import { Point } from '../types'

const BASE_REFRESH_RATE = 100

const SIGNAL_HEIGHT = 2
const SEGMENT_WIDTH = 4 // px per refresh rate

// TODO: rename to BinaryWaveService
export default class ToggleService implements IPulse {
  public id: string
  private interval: number = 0
  public width: number = 0
  private lastY: number
  public segments: Point[] = [{ x: 0, y: SIGNAL_HEIGHT }]
  private segmentWidth: number = SEGMENT_WIDTH
  public hasGeometry: boolean = true

  constructor (id) {
    this.id = id
  }

  public update = (ticks: number): void => {
    this.width += this.segmentWidth

    this.drawPulseConstant()
  }

  getLastSegment = () => {
    return this.segments[this.segments.length - 1]
  }

  addSegments = (segments) => {
    this.segments = this.segments.concat(segments)
  }

  drawPulseChange = (signal) => {
    const { x } = this.getLastSegment()
    const y = signal === LogicValue.TRUE ? 0 : SIGNAL_HEIGHT

    this.addSegments({ x, y })
  }

  drawPulseConstant = () => {
    const previous = this.segments[this.segments.length - 1]
    // if the y value from the previous segment is unchanged, just extend its x value
    const pos = this.lastY !== previous.y
      ? previous
      : this.segments.pop()

    this.lastY = previous.y

    this.addSegments({
      x: pos.x + this.segmentWidth,
      y: pos.y
    })
  }

  truncateSegments = (seconds) => {
    const widthToKeep = seconds * 40
    const widthToTruncate = this.width - widthToKeep
    let foundLastSegment = false

    if (widthToTruncate > this.width) {
      return
    }

    this.segments = this.segments
      .reverse()
      .map(({ x, y }) => {
        x -= widthToTruncate

        if (x <= 0 && !foundLastSegment) {
          foundLastSegment = true
          x = 0
        }

        return { x, y }
      })
      .reverse()

    this.width = widthToKeep
  }
}
