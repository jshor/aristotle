import cloneDeep from 'lodash.clonedeep'
import { v4 as uuid } from 'uuid'
import ItemType from '@/types/enums/ItemType'
import PortType from '@/types/enums/PortType'
import Direction from '@/types/enums/Direction'
import itemFactory from './itemFactory'
import ItemSubtype from '@/types/enums/ItemSubtype'

/**
 * Creates an integrated circuit item.
 * This will embed the ports, connections, and items provided as internal circuit elements and expose input and output ports for each input and output node, respectively.
 *
 * @param statePorts - ports belonging to all elements to embed
 * @param stateItems - items to embed
 * @param stateConnections - connections between items to embed
 */
export default function integratedCircuitFactory (state: SerializableState, name: string, width: number, height: number, subtype = ItemSubtype.CustomCircuit) {
  const { ports, items, connections, groups } = cloneDeep(state)
  const integratedCircuitItem = itemFactory(uuid(), ItemType.IntegratedCircuit, subtype, width, height)

  Object
    .values(items)
    .forEach(item => {
      const itemPorts = item
        .portIds
        .map(portId => ports[portId])

      let portSequenceNumber = 0

      // find the port type (either all input or all output)
      const homogenousPortType = itemPorts.reduce((portType: PortType | null | undefined, port) => {
        return portType === undefined || portType === port.type ? port.type : null
      }, undefined)

      // if there is no homogenous port type (either mixed or no ports), then it's not an I/O element
      if (typeof homogenousPortType !== 'number') return

      // by default, the inputs will be on the left and the outputs on the right, but the user can change this
      const orientation = homogenousPortType === PortType.Input
        ? Direction.Right
        : Direction.Left

      // loop through each input node (switch, button, etc.) and each output node (lightbulb, etc.) in the circuit
      // input nodes will convert to buffers and will take in a signal from the outside world
      // output nodes will convert to buffers and signals it receives and broadcast them to the outside world
      itemPorts
        .filter(port => port.type === homogenousPortType)
        .forEach(port => {
          const newId = uuid()
          const name = item.properties.name?.value as string || item.name

          // each input node (switch, button, etc.) will become a buffer node when simulated
          // therefore each input node (now buffer) will receive an additional input port to receive signals from the outside world
          // likewise, each output node (also now a buffer) will receive an additional output port to broadcast signals to the outside world
          // these new input and output ports will be used by both the embedded nodes and the integrated circuit element itself
          ports[newId] = {
            ...cloneDeep<Port>(port),
            type: homogenousPortType === PortType.Input
              ? PortType.Output
              : PortType.Input,
            name: itemPorts.length > 1
              ? `${name} ${portSequenceNumber++}`
              : name,
            id: newId,
            elementId: item.id,
            orientation,
            value: 0
          }

          item.portIds.push(newId)
          integratedCircuitItem.portIds.push(newId)
        })

      item.type = ItemType.Buffer
    })

  integratedCircuitItem.name = name
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

  return integratedCircuitItem
}
