import { LogicValue } from '@aristotle/logic-circuit'

const BASE_INTERVAL = 1000
const SIGNAL_HEIGHT = 2
const SEGMENT_WIDTH = 4 // px per refresh rate

// TODO: rename to BinaryWaveService
export default class ToggleService {
  constructor (id) {
    this.id = id
    this.interval = 0
    this.width = 0
    this.segments = [{ x: 0, y: SIGNAL_HEIGHT }]
    this.segmentWidth = SEGMENT_WIDTH // TODO
  }

  update = () => {
    this.drawPulseConstant()
    this.width += this.segmentWidth
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
}