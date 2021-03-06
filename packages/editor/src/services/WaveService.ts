import IPulse from '../interfaces/IPulse'

const BASE_REFRESH_RATE = 100

// TODO: rename to ClockService
export default class WaveService implements IPulse {
  public id: string

  private lastUpdate: number

  private signal: boolean = false

  private refreshRate: number = BASE_REFRESH_RATE

  private updateCallbacks: Function[] = []

  private interval: number = 0

  public hasGeometry: boolean = false

  constructor (id, interval) {
    this.id = id
    this.lastUpdate = Date.now()
    this.setInterval(interval)
  }

  onUpdate = (event) => {
    this.updateCallbacks.push(event)
  }

  public update = (ticks: number): void => {
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
