import Switch from '@/designer/elements/Switch'
import LogicGate from '@/designer/elements/LogicGate'
import Lightbulb from '@/designer/elements/Lightbulb'
import uuid from '@/utils/uuid'
import getPortIndex from '@/utils/getPortIndex'

class SerializationService {
  static getIdMapping (nodes, remapIds) {
    return nodes.reduce((map, { id }) => ({
      ...map,
      [id]: remapIds ? uuid() : id
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

  static filterBySelection (figures, connections, selection) {
    const selectionIds = selection.map(({ id }) => id)

    // filter figures 
    const filteredFigures = figures
      .filter(({ id }) => {
        return ~selectionIds.indexOf(id)
      })
      
    // filter connections
    const filteredConnections = connections
      .filter(({ inputId, outputId }) => {
        return ~selectionIds.indexOf(inputId) && ~selectionIds.indexOf(outputId)
      })

    return {
      nodes: filteredFigures,
      connections: filteredConnections
    }
  }

  static serialize (editor, selection) {
    const figures = []
    const connections = []

    // serialize figures
    editor
      .getFigures()
      .each((i, figure) => {
        figures.push({ // TODO: this should be handled by the figure itself
          id: figure.id,
          x: figure.x,
          y: figure.y,
          type: figure.constructor.name, // 'LogicGate',
          name: uuid()
        })
      })
    
    // serialize connections
    editor
      .getLines()
      .each((i, connection) => {
        const source = connection.getSource()
        const target = connection.getTarget()
        const index = getPortIndex(target, 'input')

        connections.push({
          inputId: source.getParent().id,
          outputId: target.getParent().id,
          outputPortIndex: index
        })
      })
    
    if (selection) {
      return SerializationService.filterBySelection(figures, connections, selection)
    }

    return {
      nodes: figures,
      connections
    }
  }

  static deserialize (editor, data, remapIds = false) {
    // map the old ids to new ones to avoid conflicts
    const idMap = SerializationService.getIdMapping(data.nodes, remapIds)
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
      const source = getNodeById(idMap[inputId])
      const target = getNodeById(idMap[outputId])

      if (source && target) {
        editor.addConnection(source, target, outputPortIndex)
      }
    })
  }
}

export default SerializationService
