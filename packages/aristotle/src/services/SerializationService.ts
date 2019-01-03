import Switch from '@/designer/elements/Switch'
import LogicGate from '@/designer/elements/LogicGate'
import Lightbulb from '@/designer/elements/Lightbulb'
import Editor from '@/designer/Editor'
import uuid from '@/utils/uuid'
import data from './data.json'

class SerializationService {
  public static getIdMapping (nodes: Array<any>): any {
    return nodes.reduce((map: object, { id }) => ({
      ...map,
      [id]: uuid()
    }), {})
  }

  public static getNode (type: string, id: string, name: string) {
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

  public static deserialize (editor: Editor) {
    // map the old ids to new ones to avoid conflicts
    const idMap = SerializationService.getIdMapping(data.nodes)
    const nodes: Array<Element> = []

    // deserialize nodes
    data.nodes.forEach(({ id, name, type, x, y }: {
      id: string,
      name: string,
      type: string,
      x: number,
      y: number
    }) => {
      const node = SerializationService.getNode(type, idMap[id], name)

      nodes.push(node)
      editor.addNode(node, x, y)
    })

    const getNodeById = (id: string): any => {
      return nodes
        .filter((node) => node.id === id)
        .pop()
    }

    // connect the nodes
    data.connections.forEach(({ inputId, outputId, outputPortIndex }: {
      inputId: string,
      outputId: string,
      outputPortIndex: number
    }) => {
      editor.addConnection(getNodeById(idMap[inputId]), getNodeById(idMap[outputId]), outputPortIndex)
    })
  }
}

export default SerializationService
