import ItemSubtype from '@/types/enums/ItemSubtype'
import ItemType from '@/types/enums/ItemType'
import PortType from '@/types/enums/PortType'
import Connection from '@/types/interfaces/Connection'
import Group from '@/types/interfaces/Group'
import IntegratedCircuit from '@/types/interfaces/IntegratedCircuit'
import Port from '@/types/interfaces/Port'
import Item from '@/types/interfaces/Item'

export const createConnection = (id: string, source: string, target: string, payload: Partial<Connection> = {}): Connection => ({
  id,
  source,
  target,
  connectionChainId: '1',
  groupId: null,
  isSelected: false,
  zIndex: 1,
  ...payload
})

export const createPort = (id: string, elementId: string, type: PortType, payload: Partial<Port> = {}): Port => ({
  id,
  elementId,
  name: '',
  connectedPortIds: [],
  position: {
    x: 0,
    y: 0
  },
  type,
  rotation: 0,
  orientation: 0,
  value: 0,
  hue: 0,
  isMonitored: false,
  isFreeport: false,
  ...payload
})

export const createItem = (id: string, type: ItemType, payload: Partial<Item> = {}): Item => ({
  id,
  type,
  subtype: ItemSubtype.None,
  name: '',
  portIds: [],
  groupId: null,
  rotation: 0,
  boundingBox: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  position: {
    x: 0,
    y: 0
  },
  zIndex: 0,
  width: 0,
  height: 0,
  properties: {},
  isSelected: false,
  ...payload
})

export const createIntegratedCircuit = (payload: Partial<IntegratedCircuit> = {}): IntegratedCircuit => {
  const circuit = {
    items: {},
    connections: {},
    ports: {},
    groups: {},
    ...payload
  }

  return {
    ...circuit,
    serializedState: JSON.stringify(circuit)
  }
}

export const createGroup = (id: string, itemIds: string[] = [], payload: Partial<Group> = {}): Group => ({
  id,
  itemIds,
  connectionIds: [],
  boundingBox: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  position: {
    x: 0,
    y: 0
  },
  zIndex: 0,
  isSelected: false,
  ...payload
})

export const createConnectionChain = (id: string, sourceId: string, targetId: string, segments: number) => {
  const connections: Record<string, Connection> = {}
  const items: Record<string, Item> = {}
  const ports: Record<string, Port> = {}
  const connectionChainId = `${id}ConnectionChain`

  let prevSourceId = sourceId

  for (let i = 1; i < segments; i++) {
    const freeportItem = createItem(`${id}Freeport${i}`, ItemType.Freeport, {
      portIds: [
        `${id}FreeportInputPort${i}`,
        `${id}FreeportOutputPort${i}`
      ]
    })
    const inputPort = createPort(`${id}FreeportInputPort${i}`, `${id}FreeportItem${i}`, PortType.Input, { isFreeport: true })
    const outputPort = createPort(`${id}FreeportOutputPort${i}`, `${id}FreeportItem${i}`, PortType.Input, { isFreeport: true })
    const connection = createConnection(`${id}ConnectionSegment${i}`, prevSourceId, `${id}FreeportOutputPort${i}`, { connectionChainId })

    items[freeportItem.id] = freeportItem
    ports[inputPort.id] = inputPort
    ports[outputPort.id] = outputPort
    connections[connection.id] = connection

    prevSourceId = `${id}FreeportInputPort${i}`
  }

  const lastConnection = createConnection(`${id}ConnectionSegment${segments}`, prevSourceId, targetId, { connectionChainId })

  connections[lastConnection.id] = lastConnection

  return {
    connections,
    items,
    ports,
    getConnection: (index: number) => connections[`${id}ConnectionSegment${index}`],
    getFreeport: (index: number) => items[`${id}FreeportItem${index}`]
  }
}

export const stubAll = <T extends {}>(store: T, methods: (keyof T & string)[]) => {
  methods.forEach(method => {
    jest
      .spyOn(store, method as any)
      .mockImplementation(jest.fn())
  })
}

export const createSerializedState = () => {
  return JSON.stringify({
    connections: {},
    items: {},
    ports: {},
    groups: {}
  })
}
