import Worker from './worker/index.worker'
import Editor from '../core/Editor'

export default class Oscillator {
  private clockUpdateFns: any = {}

  private worker: Worker

  private editor: Editor

  constructor (editor: Editor) {
    this.editor = editor
    this.boot()
  }

  boot = () => {
    this.worker = new (Worker as any)()
    this.worker.onmessage = ({ data }: MessageEvent) => {
      const { message, payload } = JSON.parse(data)

      switch (message) {
        case 'UPDATE_WAVES':
          this.broadcast(payload)
          break
        case 'UPDATE_CLOCK':
          this.onClockUpdate(payload)
      }
    }
    this.start()
  }

  onClockUpdate = (id) => {
    if (this.clockUpdateFns[id]) {
      this.clockUpdateFns[id]()
    }
  }

  invoke = (message: string, payload: any = null) => {
    this.worker.postMessage(JSON.stringify({ message, payload }))
  }

  /**
   * Starts the oscillator.
   */
  start = (): void => {
    console.log('WILL INVOKE START')
    this.invoke('start')
  }

  /**
   * Stops the oscillator.
   */
  stop = (): void => {
    this.invoke('stop')
  }

  registerWave = (id: string) => {
    this.invoke('registerWave', { id })
  }

  unregisterWave = (id: string) => {
    this.invoke('unregisterWave', { id })
  }

  registerClock = (id: string, interval: number, onUpdate: Function) => {
    this.invoke('registerClock', { id, interval })
    this.clockUpdateFns[id] = onUpdate
  }

  resetClockInterval = (id: string, interval: number) => {
    this.invoke('resetClockInterval', { id, interval })
  }

  drawPulseChange = (id: string, signal) => {
    this.invoke('drawPulseChange', { id, signal })
  }

  broadcast = ({ waves, secondsElapsed, secondsOffset }) => {
    // const MAX_HISTORY_COUNT = 40

    // if (this.secondsElapsed - this.secondsOffset >= MAX_HISTORY_COUNT) {
    //   this.secondsOffset += MAX_HISTORY_COUNT / 2

    //   Object
    //     .values(waves)
    //     .forEach((wave: IPulse) => {
    //       if (wave instanceof ToggleService) {
    //         wave.truncateSegments(MAX_HISTORY_COUNT / 2)
    //       }
    //     })
    // }

    this.editor.oscillate(waves, secondsElapsed, secondsOffset)
  }
}
