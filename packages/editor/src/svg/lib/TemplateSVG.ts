import svgSwitch from '../templates/switch.svg'
import svgClock from '../templates/clock.svg'
import svgLightbulb from '../templates/lightbulb.svg'
import SVGBase from './SVGBase'

interface ITemplate {
  raw: string
  width: number
  height: number
  ports: PortDefinition[]
}

const templates = {
  switch: {
    raw: svgSwitch,
    width: 96,
    height: 74,
    ports: [
      {
        type: 'output' // 'output'
      }
    ]
  } as ITemplate,
  clock: {
    raw: svgClock,
    width: 80,
    height: 50,
    ports: [
      {
        type: 'output' // 'output'
      }
    ]
  } as ITemplate,
  lightbulb: {
    raw: svgLightbulb,
    width: 100,
    height: 70,
    ports: [
      {
        type: 'input' // 'input'
      }
    ]
  } as ITemplate
}

export default class TemplateSVG extends SVGBase {
  private template: ITemplate

  private vars: {
    [key: string]: string
  } = {}

  constructor (options) {
    super (options)

    this.template = templates[options.template]
    this.setTemplateVariables(options)
  }

  setTemplateVariables = (vars): TemplateSVG => {
    this.vars = {
      ...this.vars,
      ...vars
    }

    return this
  }

  getRenderedSvg = (raw: string): string => {
    return raw.replace(/\{\{\s*([a-z]+)\s*\}\}/ig, (...args) => {
      return this.vars[args[1]]
    })
  }

  getSvgData = (): SvgData => {
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
