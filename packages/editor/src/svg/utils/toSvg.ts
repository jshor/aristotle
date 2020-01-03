
export default function toSvg (tag, attrs, children = []) {
  const attributes = [tag]

  for (const key in attrs) {
    attributes.push(`${key}="${attrs[key]}"`)
  }

  if (children.length) {
    return `<${attributes.join(' ')}>${children.join('')}</${tag}>`
  }
  return `<${ attributes.join(' ')} />`
}
