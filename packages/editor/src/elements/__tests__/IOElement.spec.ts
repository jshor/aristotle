import { LogicValue, InputNode } from '@aristotle/logic-circuit'
import ToggleService from '../../services/ToggleService'
import IOElement from '../IOElement'
import Element from '../../Element'

describe('Input/Output Element', () => {
  let element

  beforeEach(() => {
    element = new IOElement('testElement', {})
  })

  describe('when the oscilloscope visibility changes', () => {
    it('should reset the wave', () => {
      jest
        .spyOn(element, 'resetWave')
        .mockImplementation(jest.fn())

      element.settings.oscilloscope.onUpdate()

      expect(element.resetWave).toHaveBeenCalledTimes(1)
    })
  })

  describe('setInitialValue()', () => {
    it('should set the value of the element to the settings initial value', () => {
      jest
        .spyOn(element, 'setValue')
        .mockImplementation(jest.fn())

      element.setInitialValue()

      expect(element.setValue).toHaveBeenCalledTimes(1)
      expect(element.setValue).toHaveBeenCalledWith(element.settings.startValue.value)
    })
  })

  describe('resetWave()', () => {
    it('should unregister the wave if the oscilloscope value is string 0', () => {
      jest
        .spyOn(element, 'unregisterWave')
        .mockImplementation(jest.fn())

      element.settings.oscilloscope.value = '0'
      element.resetWave()

      expect(element.unregisterWave).toHaveBeenCalledTimes(1)
    })

    it('should register the wave if the oscilloscope value is not string 0', () => {
      jest
        .spyOn(element, 'registerWave')
        .mockImplementation(jest.fn())

      element.settings.oscilloscope.value = '1'
      element.resetWave()

      expect(element.registerWave).toHaveBeenCalledTimes(1)
    })
  })

  describe('unregisterWave()', () => {
    it('should remove the wave from the oscillation instance', () => {
      const wave = { id: 'wave1' }

      element.oscillation = {
        remove: jest.fn()
      }
      element.wave = wave

      jest.spyOn(element.oscillation, 'remove')
      element.unregisterWave()

      expect(element.oscillation.remove).toHaveBeenCalledTimes(1)
      expect(element.oscillation.remove).toHaveBeenCalledWith(wave)
    })
  })

  describe('registerWave()', () => {
    it('should register the wave service', () => {
      element.registerWave()

      expect(element).toHaveProperty('wave')
      expect(element.wave).toBeInstanceOf(ToggleService)
    })

    describe('when the canvas is mounted', () => {
      beforeEach(() => {
        element.canvas = {
          oscillation: {
            add: jest.fn()
          }
        }
      })

      it('should set the oscilloscope alias', () => {
        element.registerWave()

        expect(element).toHaveProperty('oscillation')
        expect(element.oscillation).toEqual(element.canvas.oscillation)
      })

      it('should add the wave to the oscilloscope', () => {
        jest.spyOn(element.canvas.oscillation, 'add')
        element.registerWave()

        expect(element.canvas.oscillation.add).toHaveBeenCalledTimes(1)
        expect(element.canvas.oscillation.add).toHaveBeenCalledWith(element.wave)
      })
    })
  })

  describe('setValue()', () => {
    const newValue = LogicValue.TRUE

    beforeEach(() => {
      element.node = {
        setValue: jest.fn()
      }
      element.canvas = {
        step: jest.fn(),
        circuit: {
          queue: []
        }
      }
      element.wave = {
        drawPulseChange: jest.fn()
      }

      jest
        .spyOn(element, 'render')
        .mockImplementation(jest.fn())
    })

    it('should set the value on the circuit node', () => {
      jest.spyOn(element.node, 'setValue')
      element.setValue(newValue)

      expect(element.node.setValue).toHaveBeenCalledTimes(1)
      expect(element.node.setValue).toHaveBeenCalledWith(newValue)
    })

    it('should draw a pulse change on the oscilloscope wave', () => {
      jest.spyOn(element.wave, 'drawPulseChange')
      element.setValue(newValue)

      expect(element.wave.drawPulseChange).toHaveBeenCalledTimes(1)
      expect(element.wave.drawPulseChange).toHaveBeenCalledWith(newValue)
    })

    it('should push the circuit node into the processing queue', () => {
      element.setValue(newValue)

      expect(element.canvas.circuit.queue).toContain(element.node)
    })

    it('should trigger the circuit', () => {
      jest.spyOn(element.canvas, 'step')
      element.setValue(newValue)

      expect(element.canvas.step).toHaveBeenCalledTimes(1)
    })

    it('should re-render the element', () => {
      element.setValue(newValue)

      expect(element.render).toHaveBeenCalledTimes(1)
    })

    describe('when in debugging mode', () => {
      beforeEach(() => {
        element.canvas.fireEvent = jest.fn()
        element.canvas.debugMode = true
        element.setValue(newValue)
      })

      it('should not trigger the circuit', () => {
        expect(element.canvas.step).not.toHaveBeenCalled()
      })

      it('should notify the event listeners that the command stack changed', () => {
        expect(element.canvas.fireEvent).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('invertValue()', () => {
    beforeEach(() => {
      jest
        .spyOn(element, 'setValue')
        .mockImplementation(jest.fn())
    })

    it(`should set the value of the node to ${LogicValue.TRUE} if the present value is ${LogicValue.FALSE}`, () => {
      element.node = {
        getProjectedValue: jest.fn(() => LogicValue.FALSE)
      }
      element.invertValue()

      expect(element.setValue).toHaveBeenCalledTimes(1)
      expect(element.setValue).toHaveBeenCalledWith(LogicValue.TRUE)
    })

    it(`should set the value of the node to ${LogicValue.TRUE} if the present value is ${LogicValue.UNKNOWN}`, () => {
      element.node = {
        getProjectedValue: jest.fn(() => LogicValue.UNKNOWN)
      }
      element.invertValue()

      expect(element.setValue).toHaveBeenCalledTimes(1)
      expect(element.setValue).toHaveBeenCalledWith(LogicValue.TRUE)
    })

    it(`should set the value of the node to ${LogicValue.FALSE} if the present value is ${LogicValue.TRUE}`, () => {
      element.node = {
        getProjectedValue: jest.fn(() => LogicValue.TRUE)
      }
      element.invertValue()

      expect(element.setValue).toHaveBeenCalledTimes(1)
      expect(element.setValue).toHaveBeenCalledWith(LogicValue.FALSE)
    })
  })
})
