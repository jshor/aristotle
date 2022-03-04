import { LogicValue } from '@aristotle/logic-circuit'

const SIGNAL_HEIGHT = 2
const SEGMENT_WIDTH = 4 // px per refresh rate

export default class BinaryWaveService implements Pulse {
  public id: string
  public width: number = 0
  private lastY: number = 0
  public segments: Point[] = [{ x: 0, y: SIGNAL_HEIGHT }]
  private segmentWidth: number = SEGMENT_WIDTH
  public hasGeometry: boolean = true

  constructor (id: string, value: number = 1) {
    this.id = id

    if (value === 1) {
      this.segments[0] = { x: 0, y: 0 }
      this.lastY = SIGNAL_HEIGHT
    }
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

    if (pos) {
      this.addSegments({
        x: pos.x + this.segmentWidth,
        y: pos.y
      })
    }
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
