import PortType from '@/types/enums/PortType'

export const createConnection = (id: string, source: string, target: string, payload: any = {}): Connection => ({
  id,
  source,
  target,
  connectionChainId: '1',
  groupId: null,
  isSelected: false,
  zIndex: 1,
  ...payload
})

export const createPort = (id: string, elementId: string, type: PortType, payload: any = {}): Port => ({
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
  isFreeport: false,
  ...payload
})

export const createItem = (id: string, type: string, payload: any = {}): Item => ({
  id,
  type,
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
  ...payload
})

export const createGroup = (id: string, itemIds: string[] = [], payload: any = {}): Group => ({
  id,
  itemIds,
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
  ...payload
})
