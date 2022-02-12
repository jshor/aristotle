import { cloneDeep } from 'lodash' // TODO
import DocumentState from '@/store/DocumentState'
import PortType from '@/types/enums/PortType'

const rand = () => `id_${(Math.floor(Math.random() * 10000000) + 5)}` // TODO: use uuid

export default function createIntegratedCircuit (state: DocumentState) {
  const ports = cloneDeep(state.ports)
  const items = cloneDeep(state.items)
  const connections = cloneDeep(state.connections)
  const createNewPort = (rotation: number, orientation: number, type: PortType, prefix: string, elementId: string): Port => ({
    id: `${prefix}_${rand()}`,
    elementId,
    position: {
      x: 0,
      y: 0
    },
    rotation,
    orientation,
    type,
    value: 0,
    isFreeport: false
  })
  const createConnection = (id: string, source: string, target: string): Connection => ({
    id,
    source,
    target,
    connectionChainId: id,
    groupId: null,
    isSelected: false,
    zIndex: 0
  })

  const documentItems = {}
  const documentPorts = {}
  const documentConnections = {}

  const icItem: Item = {
    id: rand(),
    type: 'IntegratedCircuit',
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
    properties: {},
    groupId: null,
    zIndex: 0,
    width: 200,
    height: 150
  }

  Object
    .values(items)
    .forEach(item => {
      if (item.type === 'InputNode') {
        const docItem = {
          ...cloneDeep(item),
          id: rand()
        }
        const docPort = {
          ...cloneDeep(ports[item.portIds[0]]),
          id: rand()
        }
        const port = createNewPort(item.rotation, 0, PortType.Input, 'inputNode', icItem.id)

        item.type = 'CircuitNode'
        item.portIds.unshift(port.id)
        items[item.id] = item
        ports[port.id] = port
        icItem.portIds.push(port.id)

        docItem.portIds = [docPort.id]
        documentPorts[port.id] = port
        documentPorts[docPort.id] = docPort
        documentItems[docItem.id] = docItem

        const docConnection = createConnection(`doc_conn_${rand()}`, docPort.id, port.id)
        documentConnections[docConnection.id] = docConnection
      } else if (item.type === 'OutputNode') {
        const docItem = {
          ...cloneDeep(item),
          id: rand()
        }
        const docPort = {
          ...cloneDeep(ports[item.portIds[0]]),
          id: rand()
        }
        const port = createNewPort(item.rotation, 2, PortType.Output, 'outputNode', icItem.id)

        item.type = 'CircuitNode'
        item.portIds.unshift(port.id)
        items[item.id] = item
        ports[port.id] = port
        icItem.portIds.push(port.id)

        docItem.portIds = [docPort.id]
        documentPorts[port.id] = port
        documentPorts[docPort.id] = docPort
        documentItems[docItem.id] = docItem

        const docConnection = createConnection(`inner_ic_conn_${rand()}`, port.id, docPort.id)
        documentConnections[docConnection.id] = docConnection
      }
    })

  icItem.integratedCircuit = {
    items,
    connections,
    ports
  }
  documentItems[icItem.id] = icItem

  const circuit = {
    connections: documentConnections,
    items: documentItems,
    ports: documentPorts
  }

  console.log('IC: ', JSON.stringify(circuit, null, 2))
}
