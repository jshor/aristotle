import Point from '@/types/interfaces/Point'
import {
  inflectDirection,
  getPortDirection,
  getEndpoints,
  default as renderLayout
} from '../wire'
import Port from '@/types/interfaces/Port'

describe('Wire Layout', () => {
  const createPort = (position: Point): Port => ({
    id: '',
    name: '',
    connectedPortIds: [],
    elementId: '',
    value: 0,
    isFreeport: false,
    type: 1,
    orientation: 0,
    rotation: 0,
    position,
    hue: 0,
    isMonitored: false
  })

  describe('renderLayout()', () => {
    it('should render a top-left (a) to bottom-right wire (b)', () => {
      const a: Point = { x: 20, y: 65 }
      const b: Point = { x: 30, y: 30 }

      expect(renderLayout(createPort(a), createPort(b))).toMatchSnapshot()
    })

    it('should render a bottom-left (a) to top-right wire (b)', () => {
      const a: Point = { x: 50, y: 30 }
      const b: Point = { x: 20, y: 65 }

      expect(renderLayout(createPort(a), createPort(b))).toMatchSnapshot()
    })

    it('should render a bottom-left (b) to top-right wire (a)', () => {
      const a: Point = { x: 50, y: 30 }
      const b: Point = { x: 20, y: 65 }

      expect(renderLayout(createPort(a), createPort(b))).toMatchSnapshot()
    })

    it('should render a top-left (b) to bottom-right wire (a)', () => {
      const a: Point = { x: 50, y: 65 }
      const b: Point = { x: 30, y: 30 }

      expect(renderLayout(createPort(a), createPort(b))).toMatchSnapshot()
    })
  })

  describe('inflectDirection()', () => {
    describe('when the y-value of `a` exceeds the y-value of `b`', () => {
      const a: Point = { x: 0, y: 10 }
      const b: Point = { x: 0, y: 5 }

      it('should return 2 when the direction is 0', () => {
        expect(inflectDirection(0, a, b)).toEqual(2)
      })

      it('should return 0 when the direction is 2', () => {
        expect(inflectDirection(2, a, b)).toEqual(0)
      })
    })

    describe('when the y-value of `a` is less than the y-value of `b`', () => {
      const a: Point = { x: 0, y: 5 }
      const b: Point = { x: 0, y: 10 }

      it('should return 0 when the direction is 0', () => {
        expect(inflectDirection(0, a, b)).toEqual(0)
      })

      it('should return 2 when the direction is 2', () => {
        expect(inflectDirection(2, a, b)).toEqual(2)
      })
    })

    describe('when the x-value of `a` is less than the x-value of `b`', () => {
      const a: Point = { x: 10, y: 0 }
      const b: Point = { x: 15, y: 0 }

      it('should return 3 when the direction is 1', () => {
        expect(inflectDirection(1, a, b)).toEqual(3)
      })

      it('should return 1 when the direction is 3', () => {
        expect(inflectDirection(3, a, b)).toEqual(1)
      })
    })

    describe('when the x-value of `a` exceeds the x-value of `b`', () => {
      const a: Point = { x: 15, y: 0 }
      const b: Point = { x: 10, y: 0 }

      it('should return 1 when the direction is 1', () => {
        expect(inflectDirection(1, a, b)).toEqual(1)
      })

      it('should return 3 when the direction is 3', () => {
        expect(inflectDirection(3, a, b)).toEqual(3)
      })
    })

    describe('when the direction is outside the interval [0,3]', () => {
      it('should return its transformed, rotated equivalent in the range [0,3]', () => {
        const a: Point = { x: 10, y: 0 }
        const b: Point = { x: 15, y: 0 }

        expect(inflectDirection(1, a, b)).toEqual(3)
      })

      it('should return its rotated equivalent in the range [0,3] when no transformations apply', () => {
        const a: Point = { x: 15, y: 0 }
        const b: Point = { x: 10, y: 0 }

        expect(inflectDirection(5, a, b)).toEqual(1)
      })
    })
  })

  describe('getPortDirection()', () => {
    const basePort: Port = createPort({ x: 0, y: 0 })

    it('should set the direction to be 1 less than the addition of the port\'s orientation and rotation', () => {
      const a: Point = { x: 10, y: 0 }
      const b: Point = { x: 15, y: 0 }

      const port = {
        ...basePort,
        type: 1,
        orientation: 1,
        rotation: 2
      }

      expect(getPortDirection(port, a, b)).toEqual(2)
    })

    describe('when the port is a FreePort', () => {
      describe('when the rotation is rotated to one of the top two quadrants', () => {
        const a: Point = { x: 10, y: 0 }
        const b: Point = { x: 15, y: 0 }

        it('should return 0 when the rotation is in the first quadrant', () => {
          const port = {
            ...basePort,
            type: 2,
            orientation: 1,
            rotation: 2
          }

          expect(getPortDirection(port, a, b)).toEqual(2)
        })

        it('should return 0 when the rotation is in the second quadrant', () => {
          const port = {
            ...basePort,
            type: 2,
            orientation: 1,
            rotation: 0
          }

          expect(getPortDirection(port, a, b)).toEqual(0)
        })
      })

      describe('when the rotation is rotated to the third or fourth quadrants', () => {
        const a: Point = { x: 10, y: 0 }
        const b: Point = { x: 15, y: 0 }

        it('should return 0 when the rotation is in the third quadrant', () => {
          const port = {
            ...basePort,
            type: 2,
            orientation: 2,
            rotation: 1
          }

          expect(getPortDirection(port, a, b)).toEqual(2)
        })

        it('should return 2 when the rotation is in the fourth quadrant', () => {
          const port = {
            ...basePort,
            type: 2,
            orientation: 3,
            rotation: 2
          }

          expect(getPortDirection(port, a, b)).toEqual(0)
        })
      })
    })
  })

  describe('getEndpoints()', () => {
    describe('when the x-value of `a` is less than or equal to the x-value of `b`', () => {
      describe('when the y-value of `a` is less than or equal to the y-value of `b`', () => {
        const a: Point = { x: 20, y: 30 }
        const b: Point = { x: 50, y: 65 }

        it('should return (0, 0) for the start point', () => {
          expect(getEndpoints(a, b).start).toEqual({ x: 0, y: 0 })
        })

        it('should return (30, 35) for the start point', () => {
          expect(getEndpoints(a, b).end).toEqual({ x: 30, y: 35 })
        })
      })

      describe('when the y-value of `a` exceeds the y-value of `b`', () => {
        const a: Point = { x: 20, y: 65 }
        const b: Point = { x: 30, y: 30 }

        it('should return (0, 35) for the start point', () => {
          expect(getEndpoints(a, b).start).toEqual({ x: 0, y: 35 })
        })

        it('should return (10, 0) for the start point', () => {
          expect(getEndpoints(a, b).end).toEqual({ x: 10, y: 0 })
        })
      })
    })

    describe('when the x-value of `a` exceeds the x-value of `b`', () => {
      describe('when the y-value of `a` is less than or equal to the y-value of `b`', () => {
        const a: Point = { x: 50, y: 30 }
        const b: Point = { x: 20, y: 65 }

        it('should return (30, 0) for the start point', () => {
          expect(getEndpoints(a, b).start).toEqual({ x: 30, y: 0 })
        })

        it('should return (0, 35) for the start point', () => {
          expect(getEndpoints(a, b).end).toEqual({ x: 0, y: 35 })
        })
      })

      describe('when the y-value of `a` exceeds the y-value of `b`', () => {
        const a: Point = { x: 50, y: 65 }
        const b: Point = { x: 30, y: 30 }

        it('should return (20, 35) for the start point', () => {
          expect(getEndpoints(a, b).start).toEqual({ x: 20, y: 35 })
        })

        it('should return (0, 0) for the start point', () => {
          expect(getEndpoints(a, b).end).toEqual({ x: 0, y: 0 })
        })
      })
    })
  })
})
