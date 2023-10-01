import BinaryWavePulse from '../BinaryWavePulse'
import ClockPulse from '../ClockPulse'
import Oscillator from '../'
import LogicValue from '@/types/enums/LogicValue'

describe('Oscillation Service', () => {
  let oscillator: Oscillator

  beforeEach(() => {
    oscillator = new Oscillator()
  })

  afterEach(() => jest.resetAllMocks())

  describe('start()', () => {
    const now = 5000

    beforeEach(() => {
      jest
        .spyOn(Date, 'now')
        .mockReturnValue(now)
      jest
        .spyOn(oscillator, 'tick')
        .mockImplementation(jest.fn())
    })

    it('should not re-start when the oscillator is not currently paused', () => {
      oscillator.isPaused = false
      oscillator.start()

      expect(oscillator.tick).not.toHaveBeenCalled()
    })

    describe('when the oscillator is not paused', () => {
      const lastUpdateTime = now + 3456

      beforeEach(() => {
        oscillator.lastUpdateTime = lastUpdateTime
        oscillator.isPaused = true
        oscillator.start()
      })

      it('should set the last update time to be now plus whatever time remained from the last period', () => {
        expect(oscillator.lastUpdateTime).toEqual(now + (lastUpdateTime % oscillator.refreshRate))
      })

      it('should set the isPaused flag to false', () => {
        expect(oscillator.isPaused).toBe(false)
      })

      it('should invoke tick()', () => {
        expect(oscillator.tick).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('stop()', () => {
    it('should set isPaused to true', () => {
      oscillator.stop()

      expect(oscillator.isPaused).toEqual(true)
    })
  })

  describe('reset()', () => {
    it('should set the time elapsed to zero', () => {
      oscillator.timeMsElapsed = 1000
      oscillator.reset()

      expect(oscillator.timeMsElapsed).toEqual(0)
    })

    it('should call reset on all clocks', () => {
      const clock1 = new ClockPulse('clock1', 100, LogicValue.TRUE, LogicValue.TRUE)
      const clock2 = new ClockPulse('clock2', 200, LogicValue.TRUE, LogicValue.TRUE)

      jest
        .spyOn(clock1, 'reset')
        .mockImplementation(jest.fn())
      jest
        .spyOn(clock2, 'reset')
        .mockImplementation(jest.fn())

      oscillator.clocks = { clock1, clock2 }
      oscillator.reset()

      expect(clock1.reset).toHaveBeenCalledTimes(1)
      expect(clock2.reset).toHaveBeenCalledTimes(1)
    })
  })

  describe('clear()', () => {
    it('should clear all binary oscillator waves', () => {
      const wave1 = new BinaryWavePulse('wave1', 'wave1', LogicValue.TRUE, 0)
      const wave2 = new BinaryWavePulse('wave2', 'wave2', LogicValue.TRUE, 0)

      jest
        .spyOn(wave1, 'clear')
        .mockImplementation(jest.fn())
      jest
        .spyOn(wave2, 'clear')
        .mockImplementation(jest.fn())

      oscillator.binaryWaves = { wave1, wave2 }
      oscillator.clear()

      expect(wave1.clear).toHaveBeenCalledTimes(1)
      expect(wave2.clear).toHaveBeenCalledTimes(1)
    })
  })

  describe('computeWaveGeometry()', () => {
    it('should return the oscillogram containing each binary wave having segments', () => {
      const wave1 = new BinaryWavePulse('wave1', 'wave1', LogicValue.TRUE, 123)
      const wave2 = new BinaryWavePulse('wave2', 'wave2', LogicValue.TRUE, 456)

      wave1.segments = [{ x: 0, y: 0 }, { x: 10, y: 20 }]
      wave1.width = 0
      wave2.segments = [{ x: 10, y: 20 }, { x: 30, y: 40 }]
      wave2.width = 20

      const oscillogram = oscillator.computeWaveGeometry({ wave1, wave2 })

      expect(oscillogram).toHaveProperty('wave1')
      expect(oscillogram.wave1).toEqual(expect.objectContaining({
        points: '0,0 10,20',
        width: 0,
        hue: wave1.hue
      }))
      expect(oscillogram).toHaveProperty('wave2')
      expect(oscillogram.wave2).toEqual(expect.objectContaining({
        points: '10,20 30,40',
        width: 20,
        hue: wave2.hue
      }))
    })
  })

  describe('tick()', () => {
    const now = 5000

    beforeEach(() => {
      jest
        .spyOn(oscillator, 'update')
        .mockImplementation(jest.fn())
      jest
        .spyOn(oscillator, 'start')
        .mockImplementation(jest.fn())
      jest
        .spyOn(oscillator, 'stop')
        .mockImplementation(jest.fn())
      jest
        .spyOn(oscillator, 'broadcast')
        .mockImplementation(jest.fn())
      jest
        .spyOn(Date, 'now')
        .mockReturnValue(now)
    })

    it('should not do anything when the oscillator is paused', () => {
      oscillator.isPaused = true
      oscillator.tick()

      expect(oscillator.start).not.toHaveBeenCalled()
      expect(oscillator.stop).not.toHaveBeenCalled()
      expect(oscillator.update).not.toHaveBeenCalled()
      expect(oscillator.broadcast).not.toHaveBeenCalled()
    })

    describe('when the oscillator is not paused', () => {
      beforeEach(() => {
        oscillator.isPaused = false
      })

      it('should restart the timer instead of invoking update() when the oscillator has been idle for 10 seconds', () => {
        oscillator.lastUpdateTime = now - 10000
        oscillator.tick()

        expect(oscillator.start).toHaveBeenCalledTimes(1)
        expect(oscillator.stop).toHaveBeenCalledTimes(1)
        expect(oscillator.update).not.toHaveBeenCalled()
      })

      it('should invoke update() five times when five refresh periods have passed since last update', () => {
        oscillator.lastUpdateTime = now - (oscillator.refreshRate * 5)
        oscillator.tick()

        expect(oscillator.update).toHaveBeenCalledTimes(5)
      })

      it('should broadcast when the oscillator updates', () => {
        oscillator.lastUpdateTime = now - oscillator.refreshRate
        oscillator.tick()

        expect(oscillator.broadcast).toHaveBeenCalledTimes(1)
      })

      it('should not broadcast when the oscillator has not updated', () => {
        oscillator.lastUpdateTime = now
        oscillator.tick()

        expect(oscillator.broadcast).not.toHaveBeenCalled()
      })
    })
  })

  describe('broadcast()', () => {
    const wave1 = new BinaryWavePulse('wave1', 'wave1', LogicValue.TRUE, 0)
    const wave2 = new BinaryWavePulse('wave2', 'wave2', LogicValue.TRUE, 0)

    it('should truncate segments for each binary wave when the max width has exceeded', () => {
      jest
        .spyOn(wave1, 'truncateSegments')
        .mockImplementation(jest.fn())
      jest
        .spyOn(wave2, 'truncateSegments')
        .mockImplementation(jest.fn())

      oscillator.refreshRate = 1000
      oscillator.binaryWaves = { wave1, wave2 }
      oscillator.broadcast()

      expect(wave1.truncateSegments).toHaveBeenCalledTimes(1)
      expect(wave1.truncateSegments).toHaveBeenCalledWith(0)
      expect(wave2.truncateSegments).toHaveBeenCalledTimes(1)
      expect(wave2.truncateSegments).toHaveBeenCalledWith(0)
    })
  })

  describe('update()', () => {
    it('should call `update()` on each wave', () => {
      const wave1 = new BinaryWavePulse('wave1', 'wave1', LogicValue.TRUE, 0)
      const wave2 = new BinaryWavePulse('wave2', 'wave2', LogicValue.TRUE, 0)

      jest.spyOn(wave1, 'update')
      jest.spyOn(wave2, 'update')

      oscillator.pulses = { wave1, wave2 }
      oscillator.update()

      expect(wave1.update).toHaveBeenCalledTimes(1)
      expect(wave1.update).toHaveBeenCalledWith(oscillator.timeMsElapsed)
      expect(wave2.update).toHaveBeenCalledTimes(1)
      expect(wave2.update).toHaveBeenCalledWith(oscillator.timeMsElapsed)
    })
  })

  describe('add()', () => {
    it('should add the wave to the list, with its id being the key', () => {
      const interval = 400
      const wave = new ClockPulse('wave', interval, LogicValue.TRUE, LogicValue.TRUE)

      oscillator.add(wave)

      expect(oscillator.clocks).toHaveProperty(wave.id)
      expect(oscillator.clocks[wave.id]).toEqual(wave)
    })

    it('should not add the given wave if one with its id is already registered', () => {
      const wave = new BinaryWavePulse('wave', 'wave', LogicValue.TRUE, 0)

      oscillator.binaryWaves = { wave }
      oscillator.add(wave)

      expect(Object.keys(oscillator.binaryWaves)).toEqual(['wave'])
    })
  })

  describe('remove()', () => {
    it('should remove the wave having the given id', () => {
      const wave = new BinaryWavePulse('test', 'test', LogicValue.TRUE, 0)

      oscillator.binaryWaves = { wave }
      oscillator.remove(wave)

      expect(oscillator.binaryWaves).not.toHaveProperty(wave.id)
    })
  })
})
