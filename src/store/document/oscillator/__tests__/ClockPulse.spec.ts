import LogicValue from '@/types/enums/LogicValue'
import ClockPulse from '../ClockPulse'

describe('Clock Service', () => {
  let clock: ClockPulse

  const name = 'clock'
  const interval = 1000

  beforeEach(() => {
    clock = new ClockPulse(name, interval, LogicValue.TRUE, LogicValue.FALSE)
  })

  afterEach(() => jest.resetAllMocks())

  describe('deserialize', () => {
    it('should return a ClockPulse instance when given a ClockPulse instance', () => {
      const result = ClockPulse.deserialize(clock)

      expect(result).toBe(clock)
    })

    it('should return a ClockPulse instance when given valid data', () => {
      const data = {
        name,
        interval,
        currentValue: LogicValue.TRUE,
        defaultValue: LogicValue.FALSE
      }

      const result = ClockPulse.deserialize(data)!

      expect(result).toBeInstanceOf(ClockPulse)
      expect(result.name).toEqual(name)
      expect(result.interval).toEqual(interval)
      expect(result.currentValue).toEqual(LogicValue.TRUE)
      expect(result.defaultValue).toEqual(LogicValue.FALSE)
    })

    it('should return undefined when given no data', () => {
      const result = ClockPulse.deserialize()

      expect(result).toBeUndefined()
    })
  })

  describe('toString', () => {
    it('should return an object representation of ClockPulse', () => {
      const result = clock.toString()

      expect(result).toEqual({
        name,
        interval,
        currentValue: LogicValue.TRUE,
        defaultValue: LogicValue.FALSE
      })
    })
  })

  describe('reset', () => {
    it('should reset the current value', () => {
      clock.currentValue = LogicValue.TRUE
      clock.reset()

      expect(clock.currentValue).toEqual(LogicValue.FALSE)
    })
  })

  describe('on update', () => {
    beforeEach(() => {
      clock.start()
    })

    it('should emit when a period first elapses', () => {
      const spy = jest.fn()

      clock.on('change', spy)
      clock.update(0)

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(-1)
    })

    it('should not emit when the clock is stopped', () => {
      const spy = jest.fn()

      clock.stop()
      clock.on('change', spy)
      clock.update(0)

      expect(spy).not.toHaveBeenCalled()
    })

    it('should emit a change event when the time elapsed has exceeded the interval period', () => {
      const spy = jest.fn()

      clock.on('change', spy)
      clock.update(5000)
      clock.update(interval * 2) // two periods passed

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(-1)
    })

    it('should emit an inverted signal', () => {
      const spy = jest.fn()

      clock.currentValue = LogicValue.FALSE
      clock.on('change', spy)
      clock.update(5000)
      clock.update(interval * 2) // two periods passed

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(1)
    })
  })
})
