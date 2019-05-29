import switchT from '../templates/switch.svg'
import clock from '../templates/clock.svg'
import lightbulb from '../templates/lightbulb.svg'
import SVGBase from './SVGBase'

const templates = {
  switch: {
    raw: switchT,
    width: 96,
    height: 74,
    ports: [
      { type: 'output' }
    ]
  },
  clock: {
    raw: clock,
    width: 80,
    height: 50,
    ports: [
      { type: 'output' }
    ]
  },
  lightbulb: {
    raw: lightbulb,
    width: 100,
    height: 70,
    ports: [
      { type: 'input' }
    ]
  }
}

export default class TemplateSVG extends SVGBase {
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