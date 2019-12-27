import ElementInitializerService from '../ElementInitializerService'
import Switch from '../../elements/Switch'
import LogicGate from '../../elements/LogicGate'
import Lightbulb from '../../elements/Lightbulb'
import IntegratedCircuit from '../../elements/IntegratedCircuit'

describe('Element Initializer Service', () => {
  describe('getInitializedElement()', () => {
    const id = '123456'

    it('should return an IntegratedCircuit', () => {
      expect(ElementInitializerService.getInitializedElement(id, {
        type: 'IntegratedCircuit',
        name: 'Test Circuit',
        elements: [],
        connections: [],
        ports: {
          top: [],
          bottom: [],
          left: [],
          right: []
        }
      })).toBeInstanceOf(IntegratedCircuit)
    })

    it('should return a Switch', () => {
      expect(ElementInitializerService.getInitializedElement(id, {
        type: 'Switch'
      })).toBeInstanceOf(Switch)
    })

    it('should default to a generic Element', () => {
      expect(ElementInitializerService.getInitializedElement(id, {
        type: 'Unknown'
      }).constructor.name).toEqual('Element')
    })
  })
})
