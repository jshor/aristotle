import IntervalWorkerService from '../services/IntervalWorkerService'
import Editor from '../core/Editor'
import IPulse from '../interfaces/IPulse'
import { WaveList } from '../types'
import ManagerBase from './ManagerBase'
import ToggleService from '../services/ToggleService'

const BASE_REFRESH_RATE = 100

const MAX_HISTORY_SECONDS = 5

/**
 * @class OscillationManager
 * @description Manages all oscillating services, including binary waves and clock pulses.
 * This manager uses system time (as opposed to the error-prone setInterval() or setTimeout())
 * to determine when a period (defined in `BASE_REFRESH_RATE`) has passed.
 */
export default class OscillationManager extends ManagerBase {
  private interval: IntervalWorkerService = new IntervalWorkerService()

  private waves: { [id: string]: IPulse } = {}

  private refreshRate: number = BASE_REFRESH_RATE

  private lastUpdateTime: number

  private lastSignalTime: number = 0

  private secondsElapsed: number = 0

  private secondsOffset: number = 0

  private ticks: number = 0

  constructor (editor: Editor) {
    super(editor)

    this.editor = editor
    this.lastUpdateTime = Date.now()
    this.interval.onTick(this.tick.bind(this))
  }

  /**
   * Starts the oscillator.
   */
  start = (): void => {
    this.interval.start()
  }

  /**
   * Stops the oscillator.
   */
  stop = (): void => {
    this.interval.stop()
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
    const MAX_HISTORY_COUNT = 40

    if (this.secondsElapsed - this.secondsOffset >= MAX_HISTORY_COUNT) {
      this.secondsOffset += MAX_HISTORY_COUNT / 2

      Object
        .values(this.waves)
        .forEach((wave: IPulse) => {
          if (wave instanceof ToggleService) {
            wave.truncateSegments(MAX_HISTORY_COUNT / 2)
          }
        })
    }

    this.editor.oscillate(this.computeWaveGeometry(this.waves), this.secondsElapsed, this.secondsOffset)
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
