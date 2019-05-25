import TemplateSVG from '../TemplateSVG'

describe('Template SVG renderer', () => {
  let renderer
  
  beforeEach(() => {
    renderer = new TemplateSVG({
      template: 'clock'
    })
  })

  describe('setTemplateVariables()', () => {
    const oldVars = { foo: 'bar' }
    const newVars = { baz: 'bat' }

    it('should append the given variables to the list', () => {
      renderer.vars = { ...oldVars }
      renderer.setTemplateVariables(newVars)

      expect(renderer.vars).toEqual({ ...oldVars, ...newVars })
    })

    it('should return the SVG renderer instance', () => {
      expect(renderer.setTemplateVariables(newVars)).toEqual(renderer)
    })
  })
  
  describe('getRenderedSvg()', () => {
    it('should replace the variables in the string with the ones defined', () => {
      const foo = 'bar'
      const baz = 'bat'
      const raw = '<svg>{{ foo }}: {{ baz }}</svg>'
      renderer.vars = { foo, baz }

      expect(renderer.getRenderedSvg(raw)).toEqual('<svg>bar: bat</svg>')
    })
  })
})