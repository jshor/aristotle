import SerializableState from '@/types/interfaces/SerializableState'
import integratedCircuitFactory from '../integratedCircuitFactory'
import { createItem, createPort, createConnection } from '@/store/document/actions/__tests__/__helpers__'
import ItemType from '@/types/enums/ItemType'
import PortType from '@/types/enums/PortType'
import LogicValue from '@/types/enums/LogicValue'
import ItemFactory from '@/types/types/ItemFactory'

describe('integratedCircuitFactory', () => {
  const switch1 = createItem('switch1', ItemType.InputNode, { portIds: ['switchPort1'] })
  const switch2 = createItem('switch2', ItemType.InputNode, { portIds: ['switchPort2'] })
  const doubleOutput = createItem('lightbulb', ItemType.OutputNode, { portIds: ['doubleOutputPort1', 'doubleOutputPort2'] })
  const nor = createItem('nor', ItemType.LogicGate, {
    portIds: [
      'norInputPort1',
      'norInputPort2',
      'norOutputPort'
    ]
  })

  const switchPort1 = createPort('switchPort1', 'switch1', PortType.Input)
  const switchPort2 = createPort('switchPort2', 'switch2', PortType.Input)
  const doubleOutputPort1 = createPort('doubleOutputPort1', 'lightbulb', PortType.Output)
  const doubleOutputPort2 = createPort('doubleOutputPort2', 'lightbulb', PortType.Output)
  const norInputPort1 = createPort('norInputPort1', 'nor', PortType.Input)
  const norInputPort2 = createPort('norInputPort2', 'nor', PortType.Input)
  const norOutputPort = createPort('norOutputPort', 'nor', PortType.Output)

  const switch1ToNorInput1 = createConnection('switch1ToNorInput1', 'switchPort1', 'norInputPort1')
  const switch2ToNorInput2 = createConnection('switch2ToNorInput2', 'switchPort2', 'norInputPort2')
  const norToDoubleOutputPort1 = createConnection('norToDoubleOutputPort1', 'norOutputPort', 'doubleOutputPort1')
  const norToDoubleOutputPort2 = createConnection('norToDoubleOutputPort2', 'norOutputPort', 'doubleOutputPort2')

  const baseState: SerializableState = {
    connections: {
      switch1ToNorInput1,
      switch2ToNorInput2,
      norToDoubleOutputPort1,
      norToDoubleOutputPort2
    },
    groups: {},
    items: { switch1, switch2, doubleOutput, nor },
    ports: {
      switchPort1,
      switchPort2,
      doubleOutputPort1,
      doubleOutputPort2,
      norInputPort1,
      norInputPort2,
      norOutputPort
    }
  }

  describe('packaging a basic circuit', () => {
    const name = 'Test Circuit'
    let result: ReturnType<ItemFactory>

    beforeEach(() => {
      result = integratedCircuitFactory(baseState, name)
    })

    it('should contain an integrated circuit', () => {
      expect(result.item).toHaveProperty('integratedCircuit')
    })

    it('should set the default name of the integrated circuit', () => {
      expect(result.item.defaultName).toEqual(name)
    })

    it('should maintain existing connections and groups', () => {
      const { connections, groups } = result.item.integratedCircuit!

      expect(connections).toEqual(baseState.connections)
      expect(groups).toEqual(baseState.groups)
    })

    it('should maintain the non-input and non-output items', () => {
      expect(result.item.integratedCircuit!.items).toHaveProperty(nor.id)
    })

    it('should add a serialized version of the editor state', () => {
      expect(typeof result.item.integratedCircuit!.serializedState).toBe('string')
      expect(JSON.parse(result.item.integratedCircuit!.serializedState)).toEqual(baseState)
    })

    it('should add a buffer for each output port for all input items', () => {
      const { items, ports } = result.item.integratedCircuit!
      const buffers = Object
        .values(items)
        .filter(buffer => {
          return buffer.portIds.includes('switchPort1') || buffer.portIds.includes('switchPort2')
        })

      expect(items).not.toHaveProperty(switch1.id)
      expect(items).not.toHaveProperty(switch2.id)
      expect(buffers).toHaveLength(2)

      buffers.forEach(buffer => {
        const [ inputPortId, outputPortId ] = buffer.portIds

        expect(ports).toHaveProperty(inputPortId)
        expect(ports).toHaveProperty(outputPortId)
        expect(ports[inputPortId]).toEqual(expect.objectContaining({
          connectedPortIds: [],
          defaultName: switchPort1.defaultName,
          value: LogicValue.UNKNOWN,
          type: PortType.Input,
          elementId: buffer.id // the input port should reference the new buffer
        }))
        expect(ports[outputPortId]).toEqual(expect.objectContaining({
          connectedPortIds: [],
          defaultName: switchPort2.defaultName,
          value: LogicValue.UNKNOWN,
          type: PortType.Output,
          elementId: result.item.id // the output port should reference the visual integrated circuit
        }))
      })
    })

    it('should remove the now-replaced input items', () => {
      expect(result.item.integratedCircuit!).not.toHaveProperty(switch1.id)
      expect(result.item.integratedCircuit!).not.toHaveProperty(switch2.id)
    })

    it('should add a buffer for each input port for all output items', () => {
      const { items, ports } = result.item.integratedCircuit!
      const buffers = Object
        .values(items)
        .filter(buffer => {
          return buffer.portIds.includes('doubleOutputPort1') || buffer.portIds.includes('doubleOutputPort2')
        })

      expect(buffers).toHaveLength(2)

      buffers.forEach(buffer => {
        const [ outputPortId, inputPortId ] = buffer.portIds

        expect(ports).toHaveProperty(inputPortId)
        expect(ports).toHaveProperty(outputPortId)
        expect(ports[outputPortId]).toEqual(expect.objectContaining({
          connectedPortIds: [],
          defaultName: doubleOutputPort1.defaultName,
          value: LogicValue.UNKNOWN,
          type: PortType.Output,
          elementId: buffer.id // the output port should reference the new buffer
        }))
        expect(ports[inputPortId]).toEqual(expect.objectContaining({
          connectedPortIds: [],
          defaultName: doubleOutputPort1.defaultName,
          value: LogicValue.UNKNOWN,
          type: PortType.Input,
          elementId: result.item.id // the input port should reference the visual integrated circuit
        }))
      })
    })

    it('should remove the now-replaced output items', () => {
      expect(result.item.integratedCircuit!).not.toHaveProperty(doubleOutput.id)
    })
  })
})
