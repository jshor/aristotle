import Point from '@/types/interfaces/Point'
import BinaryWavePulse from '../BinaryWavePulse'

describe('Binary Wave Service', () => {

  let service: BinaryWavePulse

  beforeEach(() => {
    service = new BinaryWavePulse('test', 'test', 1, 0)
  })

  afterEach(() => vi.resetAllMocks())

  describe('initialize()', () => {
    beforeEach(() => {
      vi
        .spyOn(service, 'addSegment')
        .mockImplementation(vi.fn())

      service.segments = []
      service.width = 0
    })

    it('should add a segment with the y value equal to 0 when the signal is high', () => {
      service.initialize(1)

      expect(service.addSegment).toHaveBeenCalledTimes(1)
      expect(service.addSegment).toHaveBeenCalledWith({ x: 1, y: 0 })
    })

    it('should add a segment with the y value equal to 1 when the signal is low', () => {
      service.initialize(0)

      expect(service.addSegment).toHaveBeenCalledTimes(1)
      expect(service.addSegment).toHaveBeenCalledWith({ x: 1, y: 1 })
    })
  })

  describe('clear()', () => {
    beforeEach(() => {
      vi.spyOn(service, 'initialize')
    })

    it('should clear out the segments and segment width', () => {
      vi
        .spyOn(service, 'initialize')
        .mockImplementation(vi.fn())

      service.clear()

      expect(service.segments).toHaveLength(0)
      expect(service.width).toEqual(0)
    })

    it('should initialize the segment with a low signal if the last signal was high', () => {
      service.initialize(1)
      service.clear()

      expect(service.initialize).toHaveBeenCalledWith(0)
    })

    it('should initialize the segment with a high signal if the last signal was low', () => {
      service.initialize(0)
      service.clear()

      expect(service.initialize).toHaveBeenCalledWith(1)
    })
  })

  describe('update()', () => {
    it('should draw a pulse constant', () => {
      vi
        .spyOn(service, 'drawPulseConstant')
        .mockImplementation(vi.fn())

      service.update(1)

      expect(service.drawPulseConstant).toHaveBeenCalledTimes(1)
    })
  })

  describe('addSegment()', () => {
    it('should remove the last segment if both the x and y values differ from the new segment', () => {
      const segment = { x: 1, y: 1 }

      service.width = 1
      service.segments = [{ x: 0, y: 0 }]
      service.addSegment(segment)

      expect(service.segments).toHaveLength(1)
      expect(service.segments).toEqual([segment])
      expect(service.width).toEqual(1)
    })
  })

  describe('drawPulseChange()', () => {
    it('should draw a vertical line from up to down when the incoming signal is high', () => {
      service.initialize(0)
      service.drawPulseChange(1)

      expect(service.segments.slice(-1)[0]).toEqual({ x: 1, y: 0 })
    })

    it('should draw a vertical line from down to up when the incoming signal is low', () => {
      service.initialize(1)
      service.drawPulseChange(0)

      expect(service.segments.slice(-1)[0]).toEqual({ x: 1, y: 1 })
    })
  })

  describe('drawPulseConstant()', () => {
    it('should render a horizontal line when the incoming signal is high', () => {
      service.initialize(0)
      service.drawPulseConstant()

      expect(service.segments.slice(-1)[0]).toEqual({ x: 2, y: 1 })
    })

    it('should render a horizontal line when the incoming signal is low', () => {
      service.initialize(1)
      service.drawPulseConstant()

      expect(service.segments.slice(-1)[0]).toEqual({ x: 2, y: 0 })
    })

    it('should re-use the previous signal line if the signal has not changed', () => {
      service.initialize(1)
      service.drawPulseConstant()
      service.drawPulseConstant()

      expect(service.segments.slice(-1)[0]).toEqual({ x: 3, y: 0 })
    })
  })

  describe('truncateSegments()', () => {
    const createSequentialSegments = (n: number): Point[] => Array(n)
      .fill({ x: 0, y: 0 })
      .map(({ y }, x) => ({ x, y }))

    it('should not truncate anything if the width of the wave is smaller than its desired width', () => {
      const segments = createSequentialSegments(7)

      service.width = 7
      service.segments = segments

      service.truncateSegments(8)

      expect(service.segments).toHaveLength(7)
      expect(service.segments).toEqual(segments)
    })

    it('should truncate the first 2 segments if the maximum is 5 and the current length is 7', () => {
      service.width = 7
      service.segments = createSequentialSegments(7)

      service.truncateSegments(5)

      expect(service.segments).toHaveLength(5)
      expect(service.segments).toEqual(createSequentialSegments(5))
    })
  })
})
