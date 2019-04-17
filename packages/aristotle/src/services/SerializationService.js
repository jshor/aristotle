import Switch from '@/designer/elements/Switch'
import LogicGate from '@/designer/elements/LogicGate'
import Lightbulb from '@/designer/elements/Lightbulb'
import IntegratedCircuit from '@/designer/elements/IntegratedCircuit'
import uuid from '@/utils/uuid'
import getPortIndex from '@/utils/getPortIndex'
import draw2d from 'draw2d'

class SerializationService {
  static getIdMapping (nodes, remapIds) {
    return nodes.reduce((map, { id }) => ({
      ...map,
      [id]: remapIds ? uuid() : id
    }), {})
  }

  static getNode (id, params) {
    switch (params.type) {
      case 'IntegratedCircuit':
        return new IntegratedCircuit(id, params)
      case 'Switch':
        return new Switch(id, params)
      case 'LogicGate':
        return new LogicGate(id, params)
      case 'Lightbulb':
        return new Lightbulb(id, params)
      default:
        return new Element(id, params)
    }
  }

  /**
   * Connects two elements together in the Editor and its circuit instance.
   *
   * @param {Editor} editor
   * @param {draw2d.Port} source - source port
   * @param {draw2d.Port} target - target port
   * @returns {draw2d.Connection}
   */
  static getConnection (editor, source, target) {
    const connection = editor.createConnection()

    connection.setSource(source)
    connection.setTarget(target)

    return connection
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
        const targetIndex = getPortIndex(target, 'input')

        connections.push({
          inputId: source.getParent().id,
          outputId: target.getParent().id,
          sourceIndex: 0, // TODO
          targetIndex
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
    const {
      CommandAdd,
      CommandConnect,
      CommandCollection
    } = draw2d.command
    const command = new CommandCollection()

    // map the old ids to new ones to avoid conflicts
    const idMap = SerializationService.getIdMapping(data.nodes, remapIds)
    const nodes = []

    // deserialize nodes
    data.nodes.forEach((params) => {
      const { x, y, id } = params
      const node = SerializationService.getNode(idMap[id], params)

      nodes.push(node)
      command.add(new CommandAdd(editor, node, x, y))
    })

    const getNodeById = (id) => {
      return nodes
        .filter((node) => node.id === id)
        .pop()
    }

    // connect the nodes
    data.connections.forEach(({ inputId, outputId, sourceIndex, targetIndex }) => {
      const source = getNodeById(idMap[inputId]).getOutputPort(sourceIndex)
      const target = getNodeById(idMap[outputId]).getInputPort(targetIndex)

      // port is not yet added to the canvas, so this would ordinarily return null
      // force getCanvas() to return the editor, as it is called by CommandConnect
      target.getCanvas = () => editor

      if (source && target) {
        const cmd = new CommandConnect(source, target)

        cmd.setConnection(SerializationService.getConnection(editor, source, target))
        command.add(cmd)
      }
    })

    // execute the command to add nodes and connect them
    editor.commandStack.execute(command)
  }
}

export default SerializationService
