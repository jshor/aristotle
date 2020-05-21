import IPulse from '../../interfaces/IPulse'
import { WaveList } from '../../types'
import ToggleService from './ToggleService'
import WaveService from './WaveService'

const BASE_REFRESH_RATE = 100

/**
 * @class OscillationManager
 * @description Manages all oscillating services, including binary waves and clock pulses.
 * This manager uses system time (as opposed to the error-prone setInterval() or setTimeout())
 * to determine when a period (defined in `BASE_REFRESH_RATE`) has passed.
 */
export default class Worker {

  private waves: { [id: string]: IPulse } = {}

  private refreshRate: number = BASE_REFRESH_RATE

  private lastUpdateTime: number

  private lastSignalTime: number = 0

  private secondsElapsed: number = 0

  private secondsOffset: number = 0

  private ticks: number = 0

  private interval: any

  /**
   * Stops the oscillator.
   */
  stop = () => {
    if (this.interval) {
      clearInterval(this.interval)
    }
  }

  /**
   * Starts the oscillator.
   */
  start = () => {
    this.interval = setInterval(() => {
      this.ticks++
      this.tick()
    }, 100)
  }


  constructor () {
    this.lastUpdateTime = Date.now()
    
    self.onmessage = this.onMessage
  }

  onMessage = ({ data }: MessageEvent) => {
    const { message, payload } = JSON.parse(data)
    
    switch (message) {
      case 'start':
        this.start()
        break
      case 'stop':
        this.stop()
        break
      case 'registerWave':
        this.registerWave(payload.id)
        break
      case 'unregisterWave':
        this.unregisterWave(payload.id)
        break
      case 'registerClock':
        this.registerClock(payload.id, payload.interval)
        break
      case 'resetClockInterval':
        this.resetClockInterval(payload.id, payload.interval)
        break
      case 'drawPulseChange':
        this.drawPulseChange(payload.id, payload.signal)
        break
    }
  }

  registeredWaves: WaveList = {}

  registeredUpdateFunctions = {}

  registerWave = (id: string) => {
    const wave: ToggleService = new ToggleService(id)

    this.registeredWaves[id] = wave
    this.add(wave)
  }

  unregisterWave = (id: string) => {
    const wave: IPulse = this.registeredWaves[id]

    if (wave) {
      this.remove(wave)

      delete this.registeredWaves[id]
    }
  }

  invoke = (message: string, payload: any = null) => {
    (self as any).postMessage(JSON.stringify({ message, payload }))
  }

  registerClock = (id: string, interval: number) => {
    const wave: WaveService = new WaveService(id, interval)

    this.registeredWaves[id] = wave
    this.add(wave)
    
    wave.onUpdate(() => {
      this.invoke('UPDATE_CLOCK', id)
    })
  }

  resetClockInterval = (id: string, interval: number) => {
    const wave: WaveService = this.registeredWaves[id] as WaveService

    if (wave) {
      wave.setInterval(interval)
    }
  }

  drawPulseChange = (id: string, signal) => {
    const wave: ToggleService = this.registeredWaves[id] as ToggleService

    if (wave) {
      wave.drawPulseChange(signal)
    }
  }

  incrementElapsed = (): void => {
    const r = this.refreshRate
    const s = this.secondsElapsed
    const oneSecond = 1000

    this.secondsElapsed = Math.round(r * (s + r / oneSecond)) / r
  }

  computeWaveGeometry = (waves: WaveList) => {
    const displays = {}
    const getPoints = (segments) => segments
        .map(({ x, y }) => `${x},${y}`)
        .join(' ')

    for (let name in waves) {
      if (waves[name].hasGeometry) {
        displays[name] = {
          points: getPoints(waves[name].segments),
          width: waves[name].width
        }
      }
    }

    return displays
  }

  broadcast = () => {
    const waves = this.computeWaveGeometry(this.waves)

    // drain all segment histories
    Object
      .values(this.waves)
      .forEach((wave: IPulse) => {
        if (wave instanceof ToggleService) {
          wave.reset()
        }
      })

    this.invoke('UPDATE_WAVES', {
      waves,
      secondsElapsed: this.secondsElapsed,
      secondsOffset: this.secondsOffset
    })
  }

  /**
   * Triggers all oscillation update events.
   */
  tick = (): void => {
    const now = Date.now()

    if (now >= this.lastUpdateTime + this.refreshRate) {
      this.update(++this.ticks)
      this.lastUpdateTime = now
      this.incrementElapsed()
    }

    if (this.secondsElapsed % 1 === 0 && this.lastSignalTime !== this.secondsElapsed) {
      this.lastSignalTime = this.secondsElapsed
      this.broadcast()
    }
  }

  /**
   * Updates all waves with the given tick count.
   *
   * @param {Number} ticks - number of tick periods accrued
   */
  update = (ticks: number): void => {
    Object
      .values(this.waves)
      .forEach((wave) => wave.update(ticks))
  }

  /**
   * Adds the given wave to the oscillator instance.
   *
   * @param {IPulse} wave
   */
  add = (wave: IPulse): void => {
    if (!this.waves.hasOwnProperty(wave.id)) {
      this.waves[wave.id] = wave
    }
  }

  /**
   * Removes the wave having the given id.
   *
   * @param {IPulse} wave
   */
  remove = ({ id }: IPulse): void => {
    delete this.waves[id]
  }
}
