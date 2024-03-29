import cloneDeep from 'lodash.clonedeep'
import { v4 as uuid } from 'uuid'
import ItemType from '@/types/enums/ItemType'
import PortType from '@/types/enums/PortType'
import Direction from '@/types/enums/Direction'
import itemFactory from './itemFactory'
import ItemSubtype from '@/types/enums/ItemSubtype'
import SerializableState from '@/types/interfaces/SerializableState'
import Port from '@/types/interfaces/Port'
import LogicValue from '@/types/enums/LogicValue'
import Item from '@/types/interfaces/Item'
import ItemFactory from '@/types/types/ItemFactory'

/**
 * Creates an integrated circuit item.
 * This will embed the ports, connections, and items provided as internal circuit elements and expose input and output ports for each input and output node, respectively.
 */
export default function integratedCircuitFactory (state: SerializableState, name: string, subtype = ItemSubtype.CustomCircuit) {
  const {
    ports,
    connections,
    groups
  } = cloneDeep(state)
  const integratedCircuitItem = itemFactory(uuid(), ItemType.IntegratedCircuit, subtype)
  const integratedCircuitPorts: Record<Direction, Port[]> = {
    [Direction.Left]: [],
    [Direction.Right]: [],
    [Direction.Top]: [],
    [Direction.Bottom]: []
  }

  const items = Object
    .values(state.items)
    .reduce((items: Record<string, Item>, item) => {
      const itemPorts = item
        .portIds
        .map(portId => ports[portId])

      // find the port type (either all input or all output)
      const homogenousPortType = itemPorts.reduce((portType: PortType | null | undefined, port) => {
        return portType === undefined || portType === port.type ? port.type : null
      }, undefined)

      // if there is no homogenous port type (either mixed or no ports), then it's not an I/O element
      if (typeof homogenousPortType !== 'number') {
        return {
          ...items,
          [item.id]: item
        }
      }

      // by default, the inputs will be on the left and the outputs on the right, but the user can change this in the builder
      const orientation = homogenousPortType === PortType.Input
        ? Direction.Right
        : Direction.Left

      // loop through each input node (switch, button, etc.) and each output node (lightbulb, etc.) in the circuit
      // each input node will convert to a buffer and will take in a signal from the outside world
      // each output node will convert to a buffer and will broadcast its signal to the outside world
      return itemPorts
        .filter(port => port.type === homogenousPortType)
        .reduce((buffers, port) => {
          const newPortId = uuid()
          const type = homogenousPortType === PortType.Input
            ? PortType.Output
            : PortType.Input

          // each buffer will receive an additional input port to receive signals from the outside world
          const bufferId = uuid()
          const buffer = itemFactory(bufferId, ItemType.Buffer, ItemSubtype.Buffer)

          port.elementId = bufferId

          // likewise, each output node (also now a buffer) will receive an additional output port to broadcast signals to the outside world
          // these new input and output ports will be used by both the embedded nodes and the integrated circuit element itself
          ports[newPortId] = {
            ...cloneDeep<Port>(port),
            type,
            defaultName: port.name,
            id: newPortId,
            elementId: integratedCircuitItem.id,
            orientation,
            value: LogicValue.UNKNOWN,
            connectedPortIds: []
          }


          buffer.portIds = [port.id, newPortId]
          integratedCircuitItem.portIds.push(newPortId)
          integratedCircuitPorts[orientation].push(ports[newPortId])

          return {
            ...buffers,
            [bufferId]: buffer
          }
        }, items)
    }, {})

  integratedCircuitItem.defaultName = name
  integratedCircuitItem.integratedCircuit = {
    items,
    connections,
    ports,
    groups,
    serializedState: JSON.stringify({
      items: state.items,
      connections: state.connections,
      ports: state.ports,
      groups: state.groups
    })
  }

  return {
    item: integratedCircuitItem,
    ports: integratedCircuitPorts
  }
}
