const BASE_REFRESH_RATE = 100

const rand = () => `id_${(Math.floor(Math.random() * 10000000) + 5)}` // TODO: use uuid

// TODO: rename to ClockService
export default class ClockService implements Pulse {
  public id: string = rand()

  public name: string

  private lastUpdate: number

  private signal: boolean = false

  private refreshRate: number = BASE_REFRESH_RATE

  private updateCallbacks: Function[] = []

  private interval: number = 0

  public hasGeometry: boolean = false

  constructor (name: string, interval) {
    this.name = name
    this.lastUpdate = Date.now()
    this.setInterval(interval)
  }

  onUpdate = (event: (signal: number) => void) => {
    this.updateCallbacks.push(event)
  }

  public update = (ticks: number): void => {
    if (ticks % this.interval === 0) {
      this.signal = !this.signal
      this.lastUpdate = Date.now()
      this.updateCallbacks.forEach((callback) => {
        callback(this.signal ? 1 : -1)
      })
    }
  }

  setInterval = (interval) => {
    this.interval = parseInt(interval) / this.refreshRate
  }
}
