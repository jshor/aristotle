import draw2d from 'draw2d'
import Element from '../core/Element'
import { Buffer, Nor, CircuitNode, LogicValue } from '@aristotle/logic-circuit'
import getPortIndex from '../utils/getPortIndex'
import { IntegratedCircuitSVG } from '../svg'
import {
  CircuitConnection,
  CircuitDefinition,
  CircuitElement,
  PortSchematic,
  SvgData
} from '../types'

/**
 * @description Embedded/integrated circuit element class. This takes an ordinary circuit definition
 * and assembles a subcircuit, where the inputs and outputs are buffers. When these buffers change,
 * the signal is propagated and the circuit is evaluated. This extends Element and renders an IC SVG.
 * @class IntegratedCircuit
 * @extends Element
 */
export default class IntegratedCircuit extends Element {
  private connectionEntries: CircuitConnection[] = []

  private elementEntries: CircuitElement[] = []

  private ports: PortSchematic

  private title: string

  protected nodes: CircuitNode[] = []

  private inputIds: string[]

  private outputIds: string[]

  /**
   * Constructor.
   *
   * @param {String} id
   * @param {Object} circuit
   * @param {Object} circuit.ports - list of port definitions
   * @param {Object} circuit.elements - list of node definitions
   * @param {Object} circuit.connections - list of connection entries
   */
  constructor (id, { ports, elements, connections, name }: CircuitDefinition) {
    super(id)

    this.connectionEntries = connections
    this.elementEntries = elements
    this.ports = ports
    this.title = name

    this.on('added', this.buildCircuit)

    this.initializeSvgRenderer()
    this.initializeCircuitNode()
    this.render()
  }

  initializeSvgRenderer = (): void => {
    this.svgRenderer = new IntegratedCircuitSVG({
      primaryColor: '#ffffff',
      secondaryColor: '#1C1D24',
      ports: this.ports,
      title: this.title
    })
  }

  initializeCircuitNode = (): void => {
    this.nodes = this.elementEntries.map(this.getInitializedNode)
    this.inputIds = this.getNodeListByType(this.elementEntries, 'input')
    this.outputIds = this.getNodeListByType(this.elementEntries, 'output')

  }

  /**
   * Returns the id of the node that the given connection is connected to.
   * The connection can be either to an input port or an output one.
   *
   * @param {Connection} connection
   * @returns {string} id of connected node
   */
  getCircuitNodeId = (connection): string => {
    const source = connection.getSource()
    const target = connection.getTarget()

    if (source.parent === this) {
      return this.outputIds[getPortIndex(source, 'output')]
    }
    return this.inputIds[getPortIndex(target, 'input')]
  }

  /**
   * Returns a circuit node with the matching id.
   *
   * @param {String} nodeId
   * @returns {CircuitNode}
   */
  getCircuitNodeById = (nodeId: string): CircuitNode => {
    return this
      .nodes
      .filter((node) => node.name === nodeId)
      .pop()
  }

  /**
   * Returns the circuit node that the given connection is connected to.
   *
   * @override {Element.getCircuitNode}
   * @param {Connection} connection
   * @returns {CircuitNode}
   */
  getCircuitNode = (connection): CircuitNode => {
    const nodeId = this.getCircuitNodeId(connection)

    return this.getCircuitNodeById(nodeId)
  }

  /**
   * Maps the ids of all nodes having the given type into an array.
   *
   * @param {Object[]} nodes - list of nodes to map ids from
   * @param {String} type - `input` or `output`
   * @returns {String[]} list of ids
   */
  getNodeListByType = (nodes: CircuitElement[], type: string): string[] => {
    return nodes
      .filter(({ nodeType }) => nodeType === type)
      .sort((a, b) => a.portIndex - b.portIndex)
      .map(({ id }) => id)
  }

  getInitializedNode = ({ id, nodeType, portIndex }: CircuitElement): CircuitNode => { // TODO: need to remap ids here too
    if (nodeType === 'input' || nodeType === 'output') {
      // replace inputs and outputs with buffers
      const node = new Buffer(id)

      if (nodeType === 'output') {
        // if the node is an output, propagate the color change
        node.on('change', (value: LogicValue) => {
          this.setOutputConnectionColor(value, portIndex)
        })
      }

      node.forceContinue = true

      return node
    }

    return new Nor(id) // TODO
  }

  /**
   * Assembles the embedded circuit for the given nodes and connections.
   */
  buildCircuit = (): void => {
    this.nodes.forEach((el) => this.canvas.circuit.addNode(el)) //.bind(this))

    this.connectionEntries.forEach(({ inputId, outputId, targetIndex }) => {
      const input = this.getCircuitNodeById(inputId)
      const output = this.getCircuitNodeById(outputId)

      this.canvas.circuit.addConnection(input, output, targetIndex)
    })
  }

  setOutputConnectionColor = (value: LogicValue, portIndex: number): void => {
    const color = this.getWireColor(value)
    const baseElement = this as draw2d.Figure

    baseElement
      .getConnections()
      .data
      .filter((connection) => connection.getSource().parent === this)
      .filter((connection) => getPortIndex(connection.getSource(), 'output') === portIndex)
      .forEach((connection) => connection.setColor(color))
  }

  getSvg = (): SvgData => {
    return (this.svgRenderer as IntegratedCircuitSVG).getSvgData()
  }
}
