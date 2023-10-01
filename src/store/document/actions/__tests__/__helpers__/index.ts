import ItemSubtype from '@/types/enums/ItemSubtype'
import ItemType from '@/types/enums/ItemType'
import PortType from '@/types/enums/PortType'
import Connection from '@/types/interfaces/Connection'
import Group from '@/types/interfaces/Group'
import IntegratedCircuit from '@/types/interfaces/IntegratedCircuit'
import Port from '@/types/interfaces/Port'
import Item from '@/types/interfaces/Item'
import ControlPoint from '@/types/interfaces/ControlPoint'

export const createConnection = (id: string, source: string, target: string, payload: Partial<Connection> = {}): Connection => ({
  id,
  source,
  target,
  groupId: null,
  isSelected: false,
  zIndex: 1,
  controlPoints: [],
  ...payload
})

export const createControlPoint = (data: Partial<ControlPoint> = {}): ControlPoint => ({
  position: {
    x: 0,
    y: 0
  },
  orientation: 0,
  rotation: 0,
  canInflect: true,
  ...data
})

export const createPort = (id: string, elementId: string, type: PortType, payload: Partial<Port> = {}): Port => ({
  id,
  elementId,
  defaultName: '',
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
  ...payload
})

export const createItem = (id: string, type: ItemType, payload: Partial<Item> = {}): Item => ({
  id,
  type,
  subtype: ItemSubtype.None,
  defaultName: '',
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
