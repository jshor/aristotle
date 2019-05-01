import Element from '../Element'
import Switch from '../elements/Switch'
import LogicGate from '../elements/LogicGate'
import Lightbulb from '../elements/Lightbulb'
import IntegratedCircuit from '../elements/IntegratedCircuit'

export default class ElementInitializerService {
  /**
   * Initializes the element based on its type.
   * 
   * @param {Object} params - any configurable params
   * @param {String} params.type - element class name
   * @returns {Element}
   */
  static getInitializedElement = (id, params) => {
    switch (params.type) {
      case 'IntegratedCircuit':
        return new IntegratedCircuit(id, params)
      case 'Switch':
        return new Switch(id, params)
      case 'LogicGate':
        return new LogicGate(id, params)
      case 'Lightbulb':
        return new Lightbulb(id, params)
      default:
        return new Element(id, params)
    }
  }
}