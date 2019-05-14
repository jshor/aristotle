import OscillationService from './OscillationService'

jest.mock('./IntervalWorkerService', () => {
  return class {
    onTick = jest.fn()
    start = jest.fn()
    stop = jest.fn()
  }
})

describe('Oscillation Service', () => {
  let service

  beforeEach(() => {
    service = new OscillationService({
      oscillate: jest.fn()
    })
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
    })

    describe('on each oscillation period (`lastSignal` divisible by 10)', () => {
      beforeEach(() => {
        service.lastSignal = 10
        service.tick()
      })

      it('should reset the `lastSignal` counter to 0', () => {
        expect(service.lastSignal).toEqual(0)
      })

      it('should call the editor\'s oscillation method', () => {
        expect(service.editor.oscillate).toHaveBeenCalledTimes(1)
        expect(service.editor.oscillate).toHaveBeenCalledWith(service.waves)
      })
    })

    describe('when an oscillation period is not yet achieved', () => {
      beforeEach(() => {
        service.lastSignal = 7
        service.tick()
      })

      it('should increment `lastSignal`', () => {
        expect(service.lastSignal).toEqual(8)
      })

      it('should not call the editor\'s oscillation method', () => {
        expect(service.editor.oscillate).not.toHaveBeenCalled()
      })
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
    const interval = 400
    const wave = {
      id: 'abc',
      interval
    }

    beforeEach(() => {
      service.add(wave)
    })

    it('should divide the wave\'s interval by the refresh rate', () => {
      expect(wave.interval).toEqual(interval / service.refreshRate)
    })

    it('should add the wave to the list, with its id being the key', () => {
      expect(service.waves).toHaveProperty(wave.id)
      expect(service.waves[wave.id]).toEqual(wave)
    })
  })

  describe('remove()', () => {
    it('should remove the wave having the given id', () => {
      const id = '123'

      service.waves = { [id]: {} }
      service.remove(id)

      expect(service.waves).not.toHaveProperty(id)
    })
  })
})
