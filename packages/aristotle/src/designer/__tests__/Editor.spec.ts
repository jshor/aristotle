import draw2d from 'draw2d'
import Canvas from '../Canvas'
import Editor from '../Editor'

jest.mock('../Canvas')

describe('Editor', () => {
  let editor: Editor

  beforeEach(() => {
    editor = new Editor('testElement')
  })

  describe('setMouseMode()', () => {
    it('should extend Canvas', () => {
      expect(editor).toBeInstanceOf(Canvas)
    })
  })
})
