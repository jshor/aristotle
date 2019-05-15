import switchT from '../templates/switch.svg'
import SVGBase from './SVGBase'

const templates = {
  switch: {
    raw: switchT,
    width: 96,
    height: 74,
    ports: [
      { type: 'output' }
    ]
  }
}

export default class SwitchSVG extends SVGBase {
  constructor (options) {
    super (options)

    this.template = templates[options.template]
    this.setTemplateVariables(options)
  }

  setTemplateVariables = (vars) => {
    this.vars = { ...this.vars, ...vars }

    return this
  }
  
  getRenderedSvg = (raw) => {
    return raw.replace(/\{\{\s*([a-z]+)\s*\}\}/ig, (...args) => {
      console.log('replacing ', args[1], this.vars)
      return this.vars[args[1]]
    })
  }
  
  getSvgData = () => {
    const { raw, width, height, ports } = this.template
    const svg = this.getRenderedSvg(raw)
    const path = this.toDataUrl(svg)

    return {
      path,
      width,
      height,
      ports
    }
  }
}