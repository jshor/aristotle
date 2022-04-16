import ClockService from '../ClockService'

describe('Clock Service', () => {
  let service: ClockService

  const name = 'clock'
  const interval = 1000

  beforeEach(() => {
    service = new ClockService(name, interval, 1)
  })

  afterEach(() => jest.resetAllMocks())

  describe('on update', () => {
    it('should not emit when a period has not yet elapsed', () => {
      const spy = jest.fn()

      service.on('change', spy)
      service.update(0)

      expect(spy).not.toHaveBeenCalled()
    })

    it('should emit a change event when the time elapsed has exceeded the interval period', () => {
      const spy = jest.fn()

      service.on('change', spy)
      service.update(5000)
      service.update(interval * 2) // two periods passed

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(-1)
    })

    it('should emit an inverted signal', () => {
      const spy = jest.fn()

      service.signal = -1
      service.on('change', spy)
      service.update(5000)
      service.update(interval * 2) // two periods passed

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(1)
    })
  })
})
