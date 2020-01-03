export default class SVGBase {
  protected primaryColor: string

  protected secondaryColor: string

  constructor (options) {
    this.primaryColor = options.primaryColor
    this.secondaryColor = options.secondaryColor
  }

  toSvg = (tag, attrs, children = []) => {
    const attributes = [tag]

    for (const key in attrs) {
      attributes.push(`${key}="${attrs[key]}"`)
    }

    if (children.length) {
      return `<${attributes.join(' ')}>${children.join('')}</${tag}>`
    }
    return `<${ attributes.join(' ')} />`
  }

  toDataUrl = (svg) => {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
  }
}
