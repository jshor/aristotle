import Pulse from '@/types/interfaces/Pulse'
import BinaryWavePulse from './BinaryWavePulse'
import Oscillogram from '@/types/types/Oscillogram'
import Point from '@/types/interfaces/Point'

/**
 * @class Oscillator
 * @description Manages all oscillating services, including binary waves and clock pulses.
 * This service uses system time to determine proper sequencing and updating.
 */
export default class Oscillator {
  /** Whether or not the oscillator is paused. */
  public isPaused: boolean = true

  /** Key-value pair of all waves. */
  public waves: Record<string, Pulse> = {}

  /** The refresh rate for the oscilloscope. */
  public refreshRate: number = 20 // TODO: this can be configured to make the waves wider/oscilloscope run faster

  /** The last time the oscillator was updated, in milliseconds. */
  public lastUpdateTime: number = Date.now()

  /** Elapsed total time, in milliseconds. */
  public timeMsElapsed: number = 0

  /** Offset wave time, in milliseconds. */
  public timeMsOffset: number = 0

  /** Change event on oscillogram generation. */
  public onTick?: (oscillogram: Oscillogram) => void

  /**
   * Starts the oscillator.
   */
  start = () => {
    if (!this.isPaused) return

    // this is the time that has elapsed prior to the completion of a full period
    // when the oscillator is stopped, we want to maintain the time progressed before the next period
    const remainingPeriodTime = this.lastUpdateTime % this.refreshRate

    this.lastUpdateTime = Date.now() + remainingPeriodTime
    this.isPaused = false
    this.tick()
  }

  /**
   * Stops the oscillator.
   */
  stop = () => {
    this.isPaused = true
  }

  /**
   * Clears all current binary wave geometries.
   */
  clear = () => {
    Object
      .values(this.waves)
      .forEach(wave => {
        if (wave instanceof BinaryWavePulse) {
          (wave as BinaryWavePulse).reset()
        }
      })
  }

  /**
   * Computes the SVG points for each given binary wave.
   *
   * @param waves
   * @returns oscillogram result
   */
  computeWaveGeometry = (waves: Record<string, Pulse>) => {
    const displays: Oscillogram = {}
    const getPoints = (segments: Point[]) => segments.map(({ x, y }) => `${x},${y}`)

    for (const id in waves) {
      if (waves[id] instanceof BinaryWavePulse) {
        const wave = waves[id] as BinaryWavePulse
        const points = getPoints(wave.segments)

        displays[id] = {
          points: points.join(' '),
          width: wave.width,
          hue: wave.hue
        }
      }
    }

    return displays
  }

  /**
   * Broadcasts the oscillogram.
   *
   * @emits change containing the oscillogram data
   */
  broadcast = () => {
    // set the max history to be twice the size of the user's screen, then cut half of it when it is exceeded
    const screenWidth = window.screen.width
    const widthOfOneSecond = 1000 / this.refreshRate
    const maxHistorySeconds = screenWidth / widthOfOneSecond

    if (this.timeMsElapsed >= this.timeMsOffset + ((maxHistorySeconds / 2) * 1000)) {
      this.timeMsOffset = this.timeMsElapsed

      Object
        .values(this.waves)
        .forEach((wave: Pulse) => {
          if (wave instanceof BinaryWavePulse) {
            wave.truncateSegments(screenWidth)
          }
        })
    }

    this.onTick?.(this.computeWaveGeometry(this.waves))
  }

  /**
   * Triggers all oscillation update events.
   */
  tick = (): void => {
    if (this.isPaused) return

    const now = Date.now()
    const MAX_IDLE_TIME = 10000 // 10 seconds
    let hasUpdated = false

    if (now >= this.lastUpdateTime + MAX_IDLE_TIME) {
      // if the oscilloscope has been idle for a while, then re-start it rather than try to catch up to the current time
      this.stop()
      this.start()
      return
    }

    while (now >= this.lastUpdateTime + this.refreshRate) {
      // loop through each refresh period elapsed and simulate as if they actually elapsed
      const delta = Math.min(this.refreshRate, now - this.lastUpdateTime)

      hasUpdated = true
      this.timeMsElapsed += delta
      this.lastUpdateTime += delta
      this.update()
    }

    if (hasUpdated) {
      this.broadcast()
    }

    requestAnimationFrame(this.tick)
  }

  /**
   * Updates all waves with the given tick count.
   */
  update = (): void => {
    Object
      .values(this.waves)
      .forEach((wave) => wave.update(this.timeMsElapsed))
  }

  /**
   * Adds the given wave to the oscillator instance.
   *
   * @param {Pulse} wave
   */
  add = (wave: Pulse): void => {
    if (!this.waves.hasOwnProperty(wave.id)) {
      this.waves[wave.id] = wave

      if (this.timeMsElapsed === 0) {
        this.broadcast()
      }
    }
  }

  /**
   * Removes the wave having the given id.
   *
   * @param {Pulse} wave
   */
  remove = (wave?: Pulse): void => {
    if (!wave) return

    delete this.waves[wave.id]

    if (Object.keys(this.waves).length === 0) {
      this.stop()
      this.clear()
    }

    this.broadcast()
  }
}
