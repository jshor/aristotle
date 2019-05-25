import { LogicValue } from '@aristotle/logic-circuit'

const BASE_INTERVAL = 1000
const SIGNAL_HEIGHT = 40
const SEGMENT_WIDTH = 2 // px per refresh rate

// TODO: rename to BinaryWaveService
export default class ToggleService {
  constructor (id) {
    this.id = id
    this.interval = 0
    this.segments = [{ x: 0, y: SIGNAL_HEIGHT }]
    this.segmentWidth = SEGMENT_WIDTH // TODO
  }

  update = () => {
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
    const pos = this.segments[this.segments.length - 1] // .pop()
    const x = pos.x + this.segmentWidth
    
    this.addSegments({ x, y: pos.y })
  }
}