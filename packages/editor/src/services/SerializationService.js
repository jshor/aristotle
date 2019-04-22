import draw2d from 'draw2d'
import Switch from '../elements/Switch'
import LogicGate from '../elements/LogicGate'
import Lightbulb from '../elements/Lightbulb'
import IntegratedCircuit from '../elements/IntegratedCircuit'
import uuid from '../utils/uuid'
import getPortIndex from '../utils/getPortIndex'

class SerializationService {

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

}

export default SerializationService
