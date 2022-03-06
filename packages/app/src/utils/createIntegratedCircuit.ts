import { cloneDeep } from 'lodash' // TODO
import DocumentState from '@/store/DocumentState'
import ItemSubtype from '@/types/enums/ItemSubtype'
import ItemType from '@/types/enums/ItemType'
import PortType from '@/types/enums/PortType'
import Direction from '@/types/enums/Direction'

const rand = () => `id_${(Math.floor(Math.random() * 10000000) + 5)}` // TODO: use uuid

export default function createIntegratedCircuit (state: DocumentState) {
  const ports = cloneDeep<{ [id: string]: Port }>(state.ports)
  const items = cloneDeep<{ [id: string]: Item }>(state.items)
  const connections = cloneDeep<{ [id: string]: Connection }>(state.connections)

  const integratedCircuitItem: Item = {
    id: rand(),
    type: ItemType.IntegratedCircuit,
    subtype: ItemSubtype.None,
    portIds: [],
    boundingBox: {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    },
    position: {
      x: 400,
      y: 400
    },
    rotation: 0,
    isSelected: false,
    properties: {
      showInOscilloscope: {
        label: 'Show in oscilloscope',
        value: false,
        type: 'boolean'
      }
    },
    groupId: null,
    zIndex: 0,
    width: 200,
    height: 150
  }

  const integratedCircuitPorts = {}

  Object
    .values(items)
    .filter(({ type }) => type === ItemType.InputNode || type === ItemType.OutputNode)
    .forEach(item => {
      const portType = item.type === ItemType.InputNode
        ? PortType.Output
        : PortType.Input
      const orientation = item.type === ItemType.InputNode
        ? Direction.Left
        : Direction.Right

      item
        .portIds
        .filter(portId => ports[portId].type === portType)
        .forEach(portId => {
          const newId = rand()

          integratedCircuitPorts[newId] = {
            ...cloneDeep<Port>(ports[portId]),
            type: item.type === ItemType.InputNode
              ? PortType.Input
              : PortType.Output,
            id: newId,
            elementId: integratedCircuitItem.id,
            virtualElementId: item.id,
            orientation
          }

          integratedCircuitItem.portIds.push(newId)
        })
    })

  integratedCircuitItem.integratedCircuit = {
    items,
    connections,
    ports
  }

  return { integratedCircuitItem, integratedCircuitPorts }
}
