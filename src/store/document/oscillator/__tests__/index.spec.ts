import BinaryWavePulse from '../BinaryWavePulse'
import ClockPulse from '../ClockPulse'
import Oscillator from '../'

describe('Oscillation Service', () => {
  let service: Oscillator

  beforeEach(() => {
    service = new Oscillator()
  })

  afterEach(() => jest.resetAllMocks())

  describe('start()', () => {
    const now = 5000

    beforeEach(() => {
      jest
        .spyOn(Date, 'now')
        .mockReturnValue(now)
      jest
        .spyOn(service, 'tick')
        .mockImplementation(jest.fn())
    })

    it('should not re-start when the oscillator is not currently paused', () => {
      service.isPaused = false
      service.start()

      expect(service.tick).not.toHaveBeenCalled()
    })

    describe('when the oscillator is not paused', () => {
      const lastUpdateTime = now + 3456

      beforeEach(() => {
        service.lastUpdateTime = lastUpdateTime
        service.isPaused = true
        service.start()
      })

      it('should set the last update time to be now plus whatever time remained from the last period', () => {
        expect(service.lastUpdateTime).toEqual(now + (lastUpdateTime % service.refreshRate))
      })

      it('should set the isPaused flag to false', () => {
        expect(service.isPaused).toBe(false)
      })

      it('should invoke tick()', () => {
        expect(service.tick).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('stop()', () => {
    it('should set isPaused to true', () => {
      service.stop()

      expect(service.isPaused).toEqual(true)
    })
  })

  describe('clear()', () => {
    it('should clear all binary service waves', () => {
      const clock = new ClockPulse('clock', 1000, 1)
      const wave = new BinaryWavePulse('wave', 'wave', 1, 0)

      jest
        .spyOn(wave, 'reset')
        .mockImplementation(jest.fn())

      service.waves = { clock, wave }
      service.clear()

      expect(wave.reset).toHaveBeenCalledTimes(1)
    })
  })

  describe('computeWaveGeometry()', () => {
    it('should return the oscillogram containing each binary wave having segments', () => {
      const wave = new BinaryWavePulse('wave', 'wave', 1, 0)
      const clock = new ClockPulse('clock', 1000, 1)

      wave.segments = [{ x: 0, y: 0 }, { x: 10, y: 20 }]
      wave.width = 0

      const oscillogram = service.computeWaveGeometry({ wave, clock })

      expect(oscillogram).toHaveProperty('wave')
      expect(oscillogram.wave).toEqual(expect.objectContaining({
        points: '0,0 10,20',
        width: 0,
        hue: expect.any(Number)
      }))
      expect(oscillogram).not.toHaveProperty('clock')
    })
  })

  describe('tick()', () => {
    const now = 5000

    beforeEach(() => {
      jest
        .spyOn(service, 'update')
        .mockImplementation(jest.fn())
      jest
        .spyOn(service, 'start')
        .mockImplementation(jest.fn())
      jest
        .spyOn(service, 'stop')
        .mockImplementation(jest.fn())
      jest
        .spyOn(service, 'broadcast')
        .mockImplementation(jest.fn())
      jest
        .spyOn(Date, 'now')
        .mockReturnValue(now)
    })

    it('should not do anything when the oscillator is paused', () => {
      service.isPaused = true
      service.tick()

      expect(service.start).not.toHaveBeenCalled()
      expect(service.stop).not.toHaveBeenCalled()
      expect(service.update).not.toHaveBeenCalled()
      expect(service.broadcast).not.toHaveBeenCalled()
    })

    describe('when the oscillator is not paused', () => {
      beforeEach(() => {
        service.isPaused = false
      })

      it('should restart the timer instead of invoking update() when the oscillator has been idle for 10 seconds', () => {
        service.lastUpdateTime = now - 10000
        service.tick()

        expect(service.start).toHaveBeenCalledTimes(1)
        expect(service.stop).toHaveBeenCalledTimes(1)
        expect(service.update).not.toHaveBeenCalled()
      })

      it('should invoke update() five times when five refresh periods have passed since last update', () => {
        service.lastUpdateTime = now - (service.refreshRate * 5)
        service.tick()

        expect(service.update).toHaveBeenCalledTimes(5)
      })

      it('should broadcast when the oscillator updates', () => {
        service.lastUpdateTime = now - service.refreshRate
        service.tick()

        expect(service.broadcast).toHaveBeenCalledTimes(1)
      })

      it('should not broadcast when the oscillator has not updated', () => {
        service.lastUpdateTime = now
        service.tick()

        expect(service.broadcast).not.toHaveBeenCalled()
      })
    })
  })

  describe('broadcast()', () => {
    const wave = new BinaryWavePulse('wave', 'wave', 1, 0)
    const clock = new ClockPulse('clock', 1000, 1)

    it('should truncate segments for each binary wave when the max width has exceeded', () => {
      jest
        .spyOn(wave, 'truncateSegments')
        .mockImplementation(jest.fn())

      service.refreshRate = 1000
      service.waves = { wave, clock }
      service.broadcast()

      expect(wave.truncateSegments).toHaveBeenCalledTimes(1)
      expect(wave.truncateSegments).toHaveBeenCalledWith(0)
    })
  })

  describe('update()', () => {
    it('should call `update()` on each wave', () => {
      const wave1 = new BinaryWavePulse('wave1', 'wave1', 1, 0)
      const wave2 = new BinaryWavePulse('wave2', 'wave2', 1, 0)

      jest.spyOn(wave1, 'update')
      jest.spyOn(wave2, 'update')

      service.waves = { wave1, wave2 }
      service.update()

      expect(wave1.update).toHaveBeenCalledTimes(1)
      expect(wave1.update).toHaveBeenCalledWith(service.timeMsElapsed)
      expect(wave2.update).toHaveBeenCalledTimes(1)
      expect(wave2.update).toHaveBeenCalledWith(service.timeMsElapsed)
    })
  })

  describe('add()', () => {
    it('should add the wave to the list, with its id being the key', () => {
      const interval = 400
      const wave = new ClockPulse('wave', interval, 1)

      service.add(wave)

      expect(service.waves).toHaveProperty(wave.id)
      expect(service.waves[wave.id]).toEqual(wave)
    })

    it('should not add the given wave if one with its id is already registered', () => {
      const wave = new BinaryWavePulse('wave', 'wave', 1, 0)

      service.waves = { wave }
      service.add(wave)

      expect(Object.keys(service.waves)).toEqual(['wave'])
    })
  })

  describe('remove()', () => {
    it('should remove the wave having the given id', () => {
      const wave = new BinaryWavePulse('test', 'test', 1, 0)

      service.waves = { wave }
      service.remove(wave)

      expect(service.waves).not.toHaveProperty(wave.id)
    })
  })
})
