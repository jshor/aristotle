import CircuitExportManager from '../CircuitExportManager'
import Editor from '../../core/Editor'
import circuit from './__fixtures__/circuit.json'
import SerializationManager from '../SerializationManager'

jest.mock('../../core/Editor')

describe('Circuit Export Service', () => {
  let manager: CircuitExportManager

  beforeEach(() => {
    const editor = new Editor('testEditor')

    manager = new CircuitExportManager(editor)
  })

  describe('getSelectedCircuit()', () => {
    let result

    beforeEach(() => {
      manager.editor.serializer = new SerializationManager(manager.editor)

      jest
        .spyOn(manager.editor.serializer, 'serializeAll')
        .mockReturnValue(circuit)

      result = manager.getSelectedCircuit()
    })

    it('should assign a ports object containing left, right, top, and bottom orientations', () => {
      expect(result).toHaveProperty('ports')
      expect(result.ports).toHaveProperty('left')
      expect(result.ports).toHaveProperty('top')
      expect(result.ports).toHaveProperty('right')
      expect(result.ports).toHaveProperty('bottom')
    })

    it('should assign the top and bottom ports to be empty', () => {
      expect(result.ports.top.length).toEqual(0)
      expect(result.ports.bottom.length).toEqual(0)
    })

    it('should maintain the same number of elements in the result', () => {
      expect(result.elements.length).toEqual(circuit.elements.length)
    })

    it('should maintain the circuit connection definitions', () => {
      expect(result.connections).toEqual(circuit.connections)
    })

    it('should assign the portIndex in sequential order to all input nodes', () => {
      const inputs = result
        .elements
        .filter(({ nodeType }) => nodeType === 'output')

      expect.assertions(inputs.length * 2)

      inputs.forEach((input, index) => {
        expect(input).toHaveProperty('portIndex')
        expect(input.portIndex).toEqual(index)
      })
    })

    it('should assign the portIndex in sequential order to all output nodes', () => {
      const outputs = result
        .elements
        .filter(({ nodeType }) => nodeType === 'output')

      expect.assertions(outputs.length * 2)

      outputs.forEach((output, index) => {
        expect(output).toHaveProperty('portIndex')
        expect(output.portIndex).toEqual(index)
      })
    })

    it('should assign the left ports to the inputs', () => {
      const inputs = circuit
        .elements
        .filter(({ nodeType }) => nodeType === 'input')

      expect.assertions(inputs.length + 1)

      // the only left ports are equal to the number of inputs in the circuit
      expect(result.ports.left.length).toEqual(inputs.length)

      inputs.forEach((node) => {
        expect(result.ports.left).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              elementId: node.id,
              label: node.id.substring(0, 3),
              type: 'input'
            })
          ])
        )
      })
    })

    it('should assign the right ports to the outputs', () => {
      const outputs = circuit
        .elements
        .filter(({ nodeType }) => nodeType === 'output')

      expect.assertions(outputs.length + 1)

      // the only right ports are equal to the number of outputs in the circuit
      expect(result.ports.right.length).toEqual(outputs.length)

      outputs.forEach((node) => {
        expect(result.ports.right).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              elementId: node.id,
              label: node.id.substring(0, 3),
              type: 'output'
            })
          ])
        )
      })
    })
  })
})
