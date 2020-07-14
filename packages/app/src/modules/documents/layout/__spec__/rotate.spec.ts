import rotate from '../rotate'

describe('rotate()', () => {
  it('should modulate the excessive positive rotation into the interval [0,3]', () => {
    expect(rotate(5)).toEqual(1)
  })

  it('should normalize the negative rotation into the interval [0,3]', () => {
    expect(rotate(-2)).toEqual(2)
  })

  describe('when the rotation is to be augmented', () => {
    it('should modulate the excessive positive rotation into the interval [0,3]', () => {
      expect(rotate(5, 3)).toEqual(0)
    })

    it('should normalize the negative rotation into the interval [0,3]', () => {
      expect(rotate(2, -2)).toEqual(0)
    })
  })
})
