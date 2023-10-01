import Pulse from '@/types/interfaces/Pulse'
import { TinyEmitter } from 'tiny-emitter'
import { v4 as uuid } from 'uuid'

/**
 * @class ClockPulse
 * @description This provides an oscillating clock wave. It oscillates between TRUE and FALSE.
 */
export default class ClockPulse implements Pulse {
  /** Wave ID. */
  public id: string = uuid()

  /** User-friendly label for this wave. */
  public name: string

  /** Current signal value. */
  public signal: number = 0

  /** Interval, in milliseconds, to oscillate at. */
  public interval: number = 0

  /** Last update time, in milliseconds. */
  private lastUpdate: number

  /** Event emitter. */
  private emitter: TinyEmitter = new TinyEmitter()

  private isStopped = false

  /**
   * Constructor.
   *
   * @param name - user-friendly label for this wave
   * @param interval - time, in milliseconds, to oscillate at
   * @param signal - current signal value to initialize at
   */
  constructor (name: string, interval: number, signal: number) {
    this.name = name
    this.signal = signal
    this.interval = interval
    this.lastUpdate = -interval
  }

  static deserialize (data?: { name: string, interval: number, signal: number } | null) {
    if (data instanceof ClockPulse) return data
    if (!data) return

    return new ClockPulse(data.name, data.interval, data.signal)
  }

  toString = () => {
    return {
      name: this.name,
      interval: this.interval,
      signal: this.signal
    }
  }

  reset = (elapsed: number) => {
    console.log('elapsed: ', this.lastUpdate % this.interval)
    this.lastUpdate = elapsed + (this.lastUpdate % this.interval)
  }

  /**
   * Event listener.
   *
   * @param event - available values: `change`
   * @param fn - callback function, taking the oscillogram data as its sole argument
   */
  on = (event: string, fn: (signal: number) => void) => {
    this.emitter.on(event, fn)
  }

  stop = () => {
    this.isStopped = true
  }

  start = () => {
    this.isStopped = false
  }

  /**
   * Updates all waves with the given time elapsed.
   *
   * @param elapsed - time elapsed during simulation
   */
  public update = (elapsed: number): void => {
    if (!this.isStopped && elapsed >= this.lastUpdate + this.interval) {
      this.signal = this.signal === -1 ? 1 : -1
      this.lastUpdate = elapsed
      this.emitter.emit('change', this.signal)
    }
  }
}
