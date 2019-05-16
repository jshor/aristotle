import WaveService from './WaveService'

export default class ToggleService extends WaveService {
  constructor (id) {
    super(id, 0)
  }
  
  change = ({ target }) => {
    this.drawPulseChange()
    this.signal = target.checked
  }
  
  drawPulseChange = () => {
    const { x } = this.getLastSegment()
    const y = this.signal ? SIGNAL_HEIGHT : 0
    
    this.addSegments({ x, y })
  }
}