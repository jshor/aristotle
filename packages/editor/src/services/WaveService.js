const BASE_INTERVAL = 1000
const SIGNAL_HEIGHT = 40
const SEGMENT_WIDTH = 2 // px per refresh rate

// TODO: rename to ClockService
export default class WaveService {
  constructor (id, interval) {
    this.id = id
    this.interval = interval
    this.lastUpdate = Date.now()
    this.signal = false
    this.segments = [{ x: 0, y: SIGNAL_HEIGHT }]
    this.segmentWidth = SEGMENT_WIDTH // TODO
    this.updateCallbacks = []
  }

  onUpdate = (event) => {
    this.updateCallbacks.push(event)
  }
  
  update = (ticks) => {
    if (ticks % this.interval === 0) {
      this.drawPulseChange()
      this.signal = !this.signal
      this.lastUpdate = Date.now()
      this.updateCallbacks.forEach((callback) => {
        callback(this.signal)
      })
    } else {
      this.drawPulseConstant()
    }
  }
  
  getLastSegment = () => {
    return this.segments[this.segments.length - 1]
  }
  
  addSegments = (segments) => {
    this.segments = this.segments.concat(segments)
  }
  
  /**
   * Draws a line like: |_ (for down), or _| (for up)
   *
   */
  drawPulseChange = () => {
    const { x, y } = this.getLastSegment()
    const deltaX = this.segmentWidth / 2
    const deltaY = this.signal ? SIGNAL_HEIGHT : 0
    
    this.addSegments([
      { x, y: deltaY }, // |
      { x: x + deltaX + deltaX, y: deltaY } // _
    ])
  }
  
  drawPulseConstant = () => {
    const pos = this.segments[this.segments.length - 1] // .pop()
    const x = pos.x + this.segmentWidth
    
    this.addSegments({ x, y: pos.y })
  }
}