import OscillationService from './OscillationService'
import Editor from '../Editor'
import ToggleService from './ToggleService'
import WaveService from './WaveService'

jest.mock('../Editor', () => {
  return class {
    oscillate = jest.fn()
  }
})

jest.mock('./IntervalWorkerService', () => {
  return class {
    onTick = jest.fn()
    start = jest.fn()
    stop = jest.fn()
  }
})

describe('Oscillation Service', () => {
  let service
  const editor = new Editor('testId')

  beforeEach(() => {
    service = new OscillationService(editor)
  })

  afterEach(() => jest.resetAllMocks())

  describe('start()', () => {
    it('should start the interval service', () => {
      jest.spyOn(service.interval, 'start')
      service.start()

      expect(service.interval.start).toHaveBeenCalledTimes(1)
    })
  })

  describe('stop()', () => {
    it('should stop the interval service', () => {
      jest.spyOn(service.interval, 'stop')
      service.stop()

      expect(service.interval.stop).toHaveBeenCalledTimes(1)
    })
  })

  describe('tick()', () => {
    describe('when the current time has surpassed the refresh window', () => {
      beforeEach(() => {
        const now = Date.now()

        service.lastUpdate = now
        Date.now = jest.fn(() => now + service.refreshRate)
      })

      it('should call update() with the incremented `ticks` counter value', () => {
        const ticks = 11

        jest.spyOn(service, 'update')

        service.ticks = ticks
        service.tick()

        expect(service.update).toHaveBeenCalledTimes(1)
        expect(service.update).toHaveBeenCalledWith(ticks + 1)
      })

      describe('when the seconds elapsed is divisble by 10', () => {
        beforeEach(() => {
          service.lastSignalTime = 10
          service.secondsElapsed = 20
          service.editor = {
            oscillate: jest.fn()
          }
          service.tick()
        })

        it('should update the `lastSignalTime` to the seconds elapsed', () => {
          expect(service.lastSignalTime).toEqual(service.secondsElapsed)
        })

        it('should tell the editor that an oscillation has elapsed', () => {
          expect(service.editor.oscillate).toHaveBeenCalledTimes(1)
          expect(service.editor.oscillate).toHaveBeenCalledWith(service.computeWaveGeometry(), service.secondsElapsed)
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

      service.waves = { foo, bar }

      const geometries = service.computeWaveGeometry()

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

      service.waves = { a: wave1, b: wave2 }
      service.update(ticks)

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

      service.add(wave)

      expect(service.waves).toHaveProperty(wave.id)
      expect(service.waves[wave.id]).toEqual(wave)
    })

    it('should not add the given wave if one with its id is already registered', () => {
      const wave = {
        id: 'abc',
        interval: 500
      }

      service.waves = {
        abc: {
          interval: 400
        }
      }
      service.add(wave)

      expect(service.waves.abc).not.toEqual(wave)
    })
  })

  describe('remove()', () => {
    it('should remove the wave having the given id', () => {
      const wave = { id: '123' }

      service.waves = { [wave.id]: wave }
      service.remove(wave)

      expect(service.waves).not.toHaveProperty(wave.id)
    })
  })
})
