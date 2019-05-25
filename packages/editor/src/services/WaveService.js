
const BASE_REFRESH_RATE = 100

// TODO: rename to ClockService
export default class WaveService {
  constructor (id, interval) {
    this.id = id
    this.lastUpdate = Date.now()
    this.signal = false
    this.refreshRate = BASE_REFRESH_RATE
    this.updateCallbacks = []
    this.setInterval(interval)
  }

  onUpdate = (event) => {
    this.updateCallbacks.push(event)
  }
  
  update = (ticks) => {
    if (ticks % this.interval === 0) {
      this.signal = !this.signal
      this.lastUpdate = Date.now()
      this.updateCallbacks.forEach((callback) => {
        callback(this.signal)
      })
    }
  }

  setInterval = (interval) => {
    this.interval = parseInt(interval) / this.refreshRate
  }
}