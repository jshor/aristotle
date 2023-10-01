import LogicValue from '@/types/enums/LogicValue'
import Pulse from '@/types/interfaces/Pulse'
import { TinyEmitter } from 'tiny-emitter'
import { v4 as uuid } from 'uuid'

/**
 * This provides an oscillating clock wave.
 * It oscillates between {@link LogicValue.TRUE} and {@link LogicValue.FALSE}.
 */
export default class ClockPulse implements Pulse {
  /** Wave ID. */
  public id: string = uuid()

  /** User-friendly label for this wave. */
  public name: string

  /** Current signal value. */
  public currentValue: LogicValue = LogicValue.UNKNOWN

  /** The default signal value. */
  public defaultValue: LogicValue = LogicValue.UNKNOWN

  /** Interval, in milliseconds, to oscillate at. */
  public interval: number = 0

  /** Last update time, in milliseconds. */
  private lastUpdate: number

  /** Event emitter. */
  private emitter: TinyEmitter = new TinyEmitter()

  /** Whether or not the pulse is stopped. */
  private isStopped = false

  /**
   * Constructor.
   *
   * @param name - user-friendly label for this wave
   * @param interval - time, in milliseconds, to oscillate at
   * @param signal - current signal value to initialize at
   */
  constructor (name: string, interval: number, currentValue: LogicValue, defaultValue: LogicValue) {
    this.name = name
    this.currentValue = currentValue
    this.defaultValue = defaultValue
    this.interval = interval
    this.lastUpdate = -interval
  }

  /**
   * Deserializes the given data into a ClockPulse instance.
   */
  static deserialize (data?: {
    name: string
    interval: number
    currentValue: LogicValue
    defaultValue: LogicValue
  } | null) {
    if (data instanceof ClockPulse) return data
    if (!data) return

    return new ClockPulse(data.name, data.interval, data.currentValue, data.defaultValue)
  }

  /**
   * Returns an object representation of the ClockPulse instance.
   */
  toString = () => {
    return {
      name: this.name,
      interval: this.interval,
      currentValue: this.currentValue,
      defaultValue: this.defaultValue
    }
  }

  /**
   * Resets the current value to the default value.
   */
  reset = () => {
    this.lastUpdate = -this.interval
    this.currentValue = this.defaultValue
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
   * Stops the clock pulse.
   */
  stop = () => {
    this.isStopped = true
  }

  /**
   * Starts the clock pulse.
   */
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
      this.currentValue = this.currentValue === LogicValue.FALSE
        ? LogicValue.TRUE
        : LogicValue.FALSE
      this.lastUpdate = elapsed
      this.emitter.emit('change', this.currentValue)
    }
  }
}
