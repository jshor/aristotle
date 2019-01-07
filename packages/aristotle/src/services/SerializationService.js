import Switch from '@/designer/elements/Switch'
import LogicGate from '@/designer/elements/LogicGate'
import Lightbulb from '@/designer/elements/Lightbulb'
import uuid from '@/utils/uuid'
import data from './data.json'

class SerializationService {
  static getIdMapping (nodes) {
    return nodes.reduce((map, { id }) => ({
      ...map,
      [id]: uuid()
    }), {})
  }

  static getNode (type, id, name) {
    switch (type) {
      case 'Switch':
        return new Switch(id, name)
      case 'LogicGate':
        return new LogicGate(id, name, 'NOR') // TODO
      case 'Lightbulb':
        return new Lightbulb(id, name)
      default:
        return new Element()
    }
  }

  static deserialize (editor) {
    // map the old ids to new ones to avoid conflicts
    const idMap = SerializationService.getIdMapping(data.nodes)
    const nodes = []

    // deserialize nodes
    data.nodes.forEach(({ id, name, type, x, y }) => {
      const node = SerializationService.getNode(type, idMap[id], name)

      nodes.push(node)
      editor.addNode(node, x, y)
    })

    const getNodeById = (id) => {
      return nodes
        .filter((node) => node.id === id)
        .pop()
    }

    // connect the nodes
    data.connections.forEach(({ inputId, outputId, outputPortIndex }) => {
      editor.addConnection(getNodeById(idMap[inputId]), getNodeById(idMap[outputId]), outputPortIndex)
    })
  }
}

export default SerializationService
