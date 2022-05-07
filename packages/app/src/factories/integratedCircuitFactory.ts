import { cloneDeep } from 'lodash' // TODO
import { v4 as uuid } from 'uuid'
import ItemType from '@/types/enums/ItemType'
import PortType from '@/types/enums/PortType'
import Direction from '@/types/enums/Direction'
import itemFactory from './itemFactory'
import DocumentState from '@/store/DocumentState'

/**
 * Creates an integrated circuit item.
 * This will embed the ports, connections, and items provided as internal circuit elements and expose input and output ports for each input and output node, respectively.
 *
 * @param statePorts - ports belonging to all elements to embed
 * @param stateItems - items to embed
 * @param stateConnections - connections between items to embed
 */
export default function integratedCircuitFactory (state: DocumentState) {
  const { ports, items, connections, groups } = cloneDeep(state) as DocumentState
  const integratedCircuitItem = itemFactory(uuid(), ItemType.IntegratedCircuit, 'Flip flop', 400, 400)

  Object
    .values(items)
    .forEach(item => {
      if (item.type !== ItemType.InputNode && item.type !== ItemType.OutputNode) return

      // loop through each input node (switch, button, etc.) and each output node (lightbulb, etc.) in the circuit
      // input nodes will convert to buffers and will take in a signal from the outside world
      // output nodes will convert to buffers and signals it receives and broadcast them to the outside world
      const portType = item.type === ItemType.InputNode
        ? PortType.Output
        : PortType.Input

      // by default, the inputs will be on the left and the outputs on the right, but the user can change this
      const orientation = item.type === ItemType.InputNode
        ? Direction.Left
        : Direction.Right

      item
        .portIds
        .filter(portId => ports[portId].type === portType)
        .forEach(portId => {
          const newId = uuid()

          // each input node (switch, button, etc.) will become a buffer node when simulated
          // therefore each input node (now buffer) will receive an additional input port to receive signals from the outside world
          // likewise, each output node (also now a buffer) will receive an additional output port to broadcast signals to the outside world
          // these new input and output ports will be used by both the embedded nodes and the integrated circuit element itself
          ports[newId] = {
            ...cloneDeep<Port>(ports[portId]),
            type: item.type === ItemType.InputNode
              ? PortType.Input
              : PortType.Output,
            id: newId,
            elementId: item.id,
            orientation
          }

          item.portIds.push(newId)
          integratedCircuitItem.portIds.push(newId)
        })

      item.type = ItemType.Buffer
    })

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
