import OscillationManager from '../OscillationManager'
import Editor from '../../core/Editor'
import ToggleService from '../../services/ToggleService'
import WaveService from '../../services/WaveService'

jest.mock('../../core/Editor', () => {
  return class {
    oscillate = jest.fn()
  }
})

jest.mock('../../services/IntervalWorkerService', () => {
  return class {
    onTick = jest.fn()
    start = jest.fn()
    stop = jest.fn()
  }
})

describe('Oscillation Manager', () => {
  let manager
  const editor = new Editor('testId')

  beforeEach(() => {
    manager = new OscillationManager(editor)
  })

  afterEach(() => jest.resetAllMocks())

  describe('start()', () => {
    it('should start the interval manager', () => {
      jest.spyOn(manager.interval, 'start')
      manager.start()

      expect(manager.interval.start).toHaveBeenCalledTimes(1)
    })
  })

  describe('stop()', () => {
    it('should stop the interval manager', () => {
      jest.spyOn(manager.interval, 'stop')
      manager.stop()

      expect(manager.interval.stop).toHaveBeenCalledTimes(1)
    })
  })

  describe('tick()', () => {
    describe('when the current time has surpassed the refresh window', () => {
      beforeEach(() => {
        const now = Date.now()

        manager.lastUpdate = now
        Date.now = jest.fn(() => now + manager.refreshRate)
      })

      it('should call update() with the incremented `ticks` counter value', () => {
        const ticks = 11

        jest.spyOn(manager, 'update')

        manager.ticks = ticks
        manager.tick()

        expect(manager.update).toHaveBeenCalledTimes(1)
        expect(manager.update).toHaveBeenCalledWith(ticks + 1)
      })

      describe('when the seconds elapsed is divisble by 10', () => {
        beforeEach(() => {
          manager.lastSignalTime = 10
          manager.secondsElapsed = 20
          manager.editor = {
            oscillate: jest.fn()
          }
          manager.tick()
        })

        it('should update the `lastSignalTime` to the seconds elapsed', () => {
          expect(manager.lastSignalTime).toEqual(manager.secondsElapsed)
        })

        it('should tell the editor that an oscillation has elapsed', () => {
          expect(manager.editor.oscillate).toHaveBeenCalledTimes(1)
          expect(manager.editor.oscillate).toHaveBeenCalledWith(manager.computeWaveGeometry(), manager.secondsElapsed)
        })
      })
    })
  })

  describe('computeWaveGeometry()', () => {
    it('should return a list of SVG geometry entries for each wave containing segments', () => {
      const foo = new ToggleService('foo')
      const bar = new WaveService('bar', 5)

      foo.segments = [{ x: 0, y: 0 }, { x: 10, y: 20 }]
      foo.width = 40

      manager.waves = { foo, bar }

      const geometries = manager.computeWaveGeometry()

      expect(geometries).toEqual(expect.objectContaining({
        foo: {
          points: '0,0 10,20',
          width: 40
        }
      }))
      expect(geometries).not.toHaveProperty('bar')
    })
  })

  describe('update()', () => {
    it('should call `update()` on each wave', () => {
      const wave1 = { update: jest.fn() }
      const wave2 = { update: jest.fn() }
      const ticks = 7

      manager.waves = { a: wave1, b: wave2 }
      manager.update(ticks)

      expect(wave1.update).toHaveBeenCalledTimes(1)
      expect(wave1.update).toHaveBeenCalledWith(ticks)
      expect(wave2.update).toHaveBeenCalledTimes(1)
      expect(wave2.update).toHaveBeenCalledWith(ticks)
    })
  })

  describe('add()', () => {
    it('should add the wave to the list, with its id being the key', () => {
      const interval = 400
      const wave = {
        id: 'abc',
        interval
      }

      manager.add(wave)

      expect(manager.waves).toHaveProperty(wave.id)
      expect(manager.waves[wave.id]).toEqual(wave)
    })

    it('should not add the given wave if one with its id is already registered', () => {
      const wave = {
        id: 'abc',
        interval: 500
      }

      manager.waves = {
        abc: {
          interval: 400
        }
      }
      manager.add(wave)

      expect(manager.waves.abc).not.toEqual(wave)
    })
  })

  describe('remove()', () => {
    it('should remove the wave having the given id', () => {
      const wave = { id: '123' }

      manager.waves = { [wave.id]: wave }
      manager.remove(wave)

      expect(manager.waves).not.toHaveProperty(wave.id)
    })
  })
})
