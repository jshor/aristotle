import ManagerBase from './ManagerBase'
import {
  CircuitElement,
  CircuitDefinition,
  PortLabel,
  SerializedCircuit
} from '../types'

export default class CircuitExportManager extends ManagerBase {
  /**
   * Assigns the `portIndex` (the order of the I/O buffer) to each element.
   *
   * @private
   * @param {string} type - `input` or `output`
   * @returns {CircuitElement[]}
   */
  assignPortIndices = (circuit: SerializedCircuit, type: string): CircuitElement[] => {
    return circuit
      .elements
      .filter(({ nodeType }) => nodeType === type)
      .map((element, portIndex) => ({
        ...element,
        portIndex
      }))
  }

  getPortLabels = (elements: CircuitElement[], type: string): PortLabel[] => {
    return elements
      .map((element: CircuitElement): PortLabel => ({
        label: element.id.substring(0, 3),
        type,
        elementId: element.id
      }))
  }

  getSelectedCircuit = (): CircuitDefinition => {
    const circuit = this.editor.serializer.serializeAll() // TODO: serializeSelection

    // assign the port index to both inputs and outputs
    const inputs: CircuitElement[] = this.assignPortIndices(circuit, 'input')
    const outputs: CircuitElement[] = this.assignPortIndices(circuit, 'output')

    // gather a list of the remaining internal elements (neither input nor output)
    const internals: CircuitElement[] = circuit
      .elements
      .filter((element) => !element.hasOwnProperty('nodeType'))

    // create a new elements entry with the I/O elements having their newly-assigned port indices
    const elements: CircuitElement[] = [
      ...internals,
      ...inputs,
      ...outputs
    ]

    // by default, set all input ports to the left and all output ports to the right
    // the user will receive a UI where they can change the positions and labels of ports
    const left: PortLabel[] = this.getPortLabels(inputs, 'input')
    const right: PortLabel[] = this.getPortLabels(outputs, 'output')

    return {
      name: 'Test Circuit', // TODO
      ports: {
        top: [],
        left,
        bottom: [],
        right
      },
      ...circuit,
      elements
    }
  }

  createIntegratedCircuit = (): void => {
    this.editor.fireEvent('circuit:export', this.getSelectedCircuit())
  }
}
