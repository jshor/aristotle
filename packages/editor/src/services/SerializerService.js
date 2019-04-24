

export default class SerializerService {
  constructor (editor) {
    this.editor = editor
  }

  serialize = (elements, connections) => {
    return {
      elements: elements.map(this.serializeOne),
      connections: connections.map(this.serializeOne)
    }
  }

  serializeOne = (figure) => {
    return figure.serialize()
  }

  serializeAll = () => {
    const elements = this.editor.getFigures().asArray()
    const connections = this.editor.getLines().asArray()

    return this.serialize(elements, connections)
  }

  serializeSelection = () => {
    const elements = []
    const connections = []
    const selection = this.editor.getSelection()

    selection
      .getAll()
      .asArray()
      .forEach((figure) => {
        if (figure.constructor.name === 'Connection') {
          connections.push(figure)
        } else {
          elements.push(figure)
        }
      })
    
    return this.serialize(elements, connections)
  }
}