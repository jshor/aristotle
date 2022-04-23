import { TinyEmitter } from 'tiny-emitter'
import { v4 as uuid } from 'uuid'

/**
 * @class ClockService
 * @description This provides an oscillating clock wave. It oscillates between TRUE and FALSE.
 */
export default class ClockService implements Pulse {
  /** Wave ID. */
  public id: string = uuid()

  /** User-friendly label for this wave. */
  public name: string

  /** Current signal value. */
  public signal: number = 0

  /** Last update time, in milliseconds. */
  private lastUpdate: number

  /** Interval, in milliseconds, to oscillate at. */
  private interval: number = 0

  /** Event emitter. */
  private emitter: TinyEmitter = new TinyEmitter()

  /**
   * Constructor.
   *
   * @param name - user-friendly label for this wave
   * @param interval - time, in milliseconds, to oscillate at
   * @param signal - current signal value to initialize at
   */
  constructor (name: string, interval: number, signal: number) {
    this.name = name
    this.lastUpdate = 0
    this.signal = signal
    this.interval = interval
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

  /**
   * Updates all waves with the given time elapsed.
   *
   * @param elapsed - time elapsed during simulation
   */
  public update = (elapsed: number): void => {
    if (elapsed >= this.lastUpdate + this.interval) {
      this.signal = this.signal === 1 ? -1 : 1
      this.lastUpdate = elapsed
      this.emitter.emit('change', this.signal)
    }
  }
}
