import boundaries from '../boundaries'

describe('Boundaries geometry utility', () => {
  describe('isInNeighborhood()', () => {
    it('should return true if a is within b\'s radius', () => {
      const a = { x: 10, y: 10 }
      const b = { x: 5, y: 6 }

      expect(boundaries.isInNeighborhood(a, b, 10)).toBe(true)
    })

    it('should return true if b is within a\'s radius', () => {
      const a = { x: 5, y: 6 }
      const b = { x: 10, y: 10 }

      expect(boundaries.isInNeighborhood(a, b, 10)).toBe(true)
    })

    it('should return false if a is outside of b\'s neighborhood', () => {
      const a = { x: 5, y: 6 }
      const b = { x: 20, y: 20 }

      expect(boundaries.isInNeighborhood(a, b, 10)).toBe(false)
    })
  })

  describe('getGridSnapPosition()', () => {
    it('should return the delta of rounding the top left point to the nearest 10', () => {
      const boundingBox = {
        left: 7,
        top: 36,
        bottom: 12,
        right: 11
      }

      expect(boundaries.getGridSnapPosition(boundingBox, 10)).toEqual({ x: 3, y: 4 })
    })
  })

  describe('offset snapping methods', () => {
    /** Helper method to generate 100x100 size bounding boxes for the given top/left points. */
    const generateBoundingBoxes = (b: [ number, number ][]): BoundingBox[] => b.map(([ left, top ]) => ({
      bottom: top + 100,
      right: left + 100,
      left,
      top
    }))

    describe('getRadialSnapOffset()', () => {
      const boundingBox = generateBoundingBoxes([[66, 26]])[0]

      it('should return the offset between the top of `a` and the bottom of `b`', () => {
        const boundingBoxes = generateBoundingBoxes([
          [10, 12],
          [64, 24], // target
          [32, 76]
        ])

        expect(boundaries.getRadialSnapOffset(boundingBoxes, boundingBox, 10)).toEqual({
          x: -2,
          y: -2
        })
      })
    })

    describe('getOuterSnapOffset()', () => {
      function assertSnapping (description: string, top: number, left: number, point: Point) {
        it(`should return the offset between a and b when ${description}`, () => {
          const boundingBox = generateBoundingBoxes([[top, left]])[0] // a
          const boundingBoxes = generateBoundingBoxes([
            [10, 12],
            [64, 24] // b (target)
          ])

          expect(boundaries.getOuterSnapOffset(boundingBoxes, boundingBox, 5)).toEqual(point)
        })
      }

      describe('when the left of a is within the x-range of b', () => {
        assertSnapping('the bottom of a is within snapping distance of the top of b', 70, 22 - 100, { x: 0, y: 2 })
        assertSnapping('the top of a is within snapping distance of the bottom of b', 70, 26 + 100, { x: 0, y: -2 })
      })

      describe('when the right of a is within the x-range of b', () => {
        assertSnapping('the bottom of a is within snapping distance of the top of b', 70 - 100, 22 - 100, { x: 0, y: 2 })
        assertSnapping('the top of a is within snapping distance of the bottom of b', 70 - 100, 26 + 100, { x: 0, y: -2 })
      })

      describe('when the top of a is within the y-range of b', () => {
        assertSnapping('the right of a is within snapping distance of the left of b', 63 - 100, 30, { x: 1, y: 0 })
        assertSnapping('the left of a is within snapping distance of the right of b', 67 + 100, 30, { x: -3, y: 0 })
      })

      describe('when the bottom of a is within the y-range of b', () => {
        assertSnapping('the right of a is within snapping distance of the left of b', 63 - 100, 30 - 100, { x: 1, y: 0 })
        assertSnapping('the left of a is within snapping distance of the right of b', 67 + 100, 30 - 100, { x: -3, y: 0 })
      })

      it('should return no offset when a is not within snapping distance of b', () => {
        const boundingBox = generateBoundingBoxes([[200, 250]])[0]

        expect(boundaries.getOuterSnapOffset([], boundingBox, 5)).toEqual({ x: 0, y: 0 })
      })
    })
  })

  describe('isLineIntersectingRectangle()', () => {
    const boundingBox = {
      left: 100,
      top: 100,
      right: 200,
      bottom: 200
    }

    /** Tests whether or not the line from (x1, y1) to (x2, y2), and its reverse, intersect the bounding box. */
    function assertIntersection (x1: number, y1: number, x2: number, y2: number, isIntersecting: boolean) {
      it(`should return ${isIntersecting} when the line from (${x1}, ${y1}) to (${x2}, ${y2}) intersects the rectangle`, () => {
        const a1 = { x: x1, y: y1 }
        const a2 = { x: x2, y: y2 }

        expect(boundaries.isLineIntersectingRectangle(a1, a2, boundingBox)).toBe(isIntersecting)
        expect(boundaries.isLineIntersectingRectangle(a2, a1, boundingBox)).toBe(isIntersecting)
      })
    }

    assertIntersection(50, 150, 150, 150, true)
    assertIntersection(150, 150, 250, 150, true)
    assertIntersection(150, 50, 150, 150, true)
    assertIntersection(150, 150, 150, 250, true)

    assertIntersection(50, 150, 99, 150, false)
    assertIntersection(201, 150, 250, 150, false)
    assertIntersection(150, 50, 150, 99, false)
    assertIntersection(150, 201, 150, 250, false)
  })

  describe('hasIntersection()', () => {
    const boundingBox = {
      left: 100,
      top: 100,
      right: 200,
      bottom: 200
    }

    function assertIsIntersecting (description: string, top: number, left: number, isIntersecting: boolean) {
      it(`should return ${isIntersecting} when ${description} or vice-versa`, () => {
        const a = {
          top,
          left,
          right: left + 100,
          bottom: top + 100
        }

        expect(boundaries.hasIntersection(a, boundingBox)).toBe(isIntersecting)
        expect(boundaries.hasIntersection(boundingBox, a)).toBe(isIntersecting)
      })
    }

    assertIsIntersecting('a is left of b', -50, 150, false)
    assertIsIntersecting('a is right of b', 250, 150, false)
    assertIsIntersecting('a is above b', 150, -50, false)
    assertIsIntersecting('a is below b', 150, 250, false)

    assertIsIntersecting('a overlaps the left side of b', 50, 150, true)
    assertIsIntersecting('a overlaps the right side of b', 150, 150, true)
    assertIsIntersecting('a overlaps the top of b', 150, 50, true)
    assertIsIntersecting('a overlaps the bottom of b', 150, 150, true)
  })

  describe('scaleBoundingBox()', () => {
    it('should scale the bounding box by the given scalar', () => {
      expect(boundaries.scaleBoundingBox({
        left: 10,
        top: 20,
        right: 30,
        bottom: 40
      }, 3)).toEqual({
        left: 30,
        top: 60,
        right: 90,
        bottom: 120
      })
    })
  })

  describe('isTwoDimensional()', () => {
    it('should return true if the box has a width and a height', () => {
      expect(boundaries.isOneOrTwoDimensional({
        left: 100,
        top: 100,
        bottom: 200,
        right: 200
      })).toBe(true)
    })

    it('should return true if the box has no width but has a height', () => {
      expect(boundaries.isOneOrTwoDimensional({
        left: 100,
        top: 100,
        bottom: 200,
        right: 100
      })).toBe(true)
    })

    it('should return false if the box has no height but has a width', () => {
      expect(boundaries.isOneOrTwoDimensional({
        left: 100,
        top: 100,
        bottom: 100,
        right: 200
      })).toBe(true)
    })

    it('should return false if the box has no width and no height', () => {
      expect(boundaries.isOneOrTwoDimensional({
        left: 100,
        top: 100,
        bottom: 100,
        right: 100
      })).toBe(false)
    })
  })

  describe('getLinearBoundaries()', () => {
    it('should return a list of one infinitely-horizontal and one infinitely-vertical boundaries', () => {
      const point = { x: 10, y: 20 }

      expect(boundaries.getLinearBoundaries(point)).toEqual([
        {
          left: point.x,
          right: point.x,
          top: -Infinity,
          bottom: Infinity
        },
        {
          left: -Infinity,
          right: Infinity,
          top: point.y,
          bottom: point.y
        }
      ])
    })
  })

  describe('getPointBoundary()', () => {
    it('should convert the given point to a bounding box', () => {
      expect(boundaries.getPointBoundary({ x: 10, y: 20 })).toEqual({
        left: 10,
        top: 20,
        right: 10,
        bottom: 20
      })
    })
  })

  describe('getItemBoundingBox()', () => {
    const position = { x: 12, y: 20 }
    const width = 20
    const height = 30

    it('should return the bounding box for an item that is not rotated', () => {
      expect(boundaries.getBoundingBox(position, 0, width, height)).toEqual({
        bottom: 50,
        left: 12,
        right: 32,
        top: 20
      })
    })

    it('should return the bounding box for an item that is rotated 90 degrees', () => {
      expect(boundaries.getBoundingBox(position, 1, width, height)).toEqual({
        bottom: 45,
        left: 7,
        right: 37,
        top: 25
      })
    })

    it('should return the bounding box for an item that is rotated 180 degrees', () => {
      expect(boundaries.getBoundingBox(position, 2, width, height)).toEqual({
        bottom: 50,
        left: 12,
        right: 32,
        top: 20
      })
    })

    it('should return the bounding box for an item that is rotated 270 degrees', () => {
      expect(boundaries.getBoundingBox(position, 3, width, height)).toEqual({
        bottom: 45,
        left: 7,
        right: 37,
        top: 25
      })
    })
  })

  describe('getGroupBoundingBox()', () => {
    it('should return a bounding box having the minimal position as the top left and maximal as the bottom right', () => {
      expect(boundaries.getGroupBoundingBox([
        {
          left: -30,
          top: -10,
          bottom: 30,
          right: 40
        },
        {
          left: 30,
          top: 10,
          bottom: 130,
          right: 140
        }
      ])).toEqual({
        left: -30,
        top: -10,
        bottom: 130,
        right: 140
      })
    })
  })

  describe('getBoundingBoxMidpoint()', () => {
    it('should return the center point of the given bounding box', () => {
      expect(boundaries.getBoundingBoxMidpoint({
        left: -30,
        top: -10,
        bottom: 30,
        right: 40
      })).toEqual({ x: 35, y: 20 })
    })
  })
})
