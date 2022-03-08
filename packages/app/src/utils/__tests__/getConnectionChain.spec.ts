import '../getConnectionChain'
import PortType from '@/types/enums/PortType'
import getConnectionChain from '../getConnectionChain'

const createConnection = (id: string, source: string, target: string, payload: any = {}): Connection => ({
  id,
  source,
  target,
  connectionChainId: '1',
  groupId: null,
  isSelected: false,
  zIndex: 1,
  ...payload
})

const createPort = (id: string, elementId: string, type: PortType, payload: any = {}): Port => ({
  id,
  elementId,
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

describe('getConnectionChain()', () => {
  const inputPort = createPort('inputPort', 'freeportItem', PortType.Input, { isFreeport: true })
  const outputPort = createPort('outputPort', 'freeportItem', PortType.Output, { isFreeport: true })
  const startPort = createPort('startPort', 'item1', PortType.Output)
  const endPort = createPort('endPort', 'item2', PortType.Input)
  const connectionPart1 = createConnection('connectionPart1', 'startPort', 'inputPort', { connectionChainId: 'connectionPart1' })
  const connectionPart2 = createConnection('connectionPart2', 'outputPort', 'endPort', { connectionChainId: 'connectionPart1' })
  const otherConnection = createConnection('otherConnection', 'port1', 'port2', { connectionChainId: 'otherConnectionChain' })

  describe('description', () => {
    const ports = { inputPort, outputPort, startPort, endPort }
    const connections = [connectionPart1, connectionPart2, otherConnection]

    it('should return the connection ids and any associated freeport ids', () => {
      const { connectionIds, freeportIds } = getConnectionChain(connections, ports, 'connectionPart1')

      expect(connectionIds).toEqual(['connectionPart1', 'connectionPart2'])
      expect(freeportIds).toEqual(['freeportItem'])
    })

    it('should not return connections that are not part of the chain', () => {
      const { connectionIds } = getConnectionChain(connections, ports, 'connectionPart1')

      expect(connectionIds).not.toContain(['otherConnection'])
    })
  })
})
