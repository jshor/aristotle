import CommandSetInputCount from './CommandSetInputCount'
import LogicGate from '../elements/LogicGate'
import Element from '../core/Element'
import Connection from '../core/Connection'
import { Circuit } from '@aristotle/logic-circuit'
import draw2d from 'draw2d'

const locator = new draw2d.layout.locator.XYAbsPortLocator(0, 0)

describe('CommandSetInputCount', () => {
  let editor
  let element
  let inputElements
  let outputElement

  function connect (source, target, index) {
    const connection = new Connection(new Circuit())

    connection.setSource(source.getOutputPort(0))
    connection.setTarget(target.getInputPort(index))

    editor.add(connection, locator)
  }

  beforeEach(() => {
    editor = new Element('testEditor', {})

    // configure elements
    inputElements = [
      new LogicGate('A', {}),
      new LogicGate('B', {}),
      new LogicGate('C', {})
    ]
    element = new LogicGate('D', {}) // testing element
    outputElement = new LogicGate('E', {})

    // add to editor
    editor.add(inputElements[0], locator)
    editor.add(inputElements[1], locator)
    editor.add(inputElements[2], locator)
    editor.add(element, locator)
    editor.add(outputElement, locator)

    // configure connections
    connect(inputElements[0], element, 0)
    connect(inputElements[1], element, 1)
    connect(element, outputElement, 0)

    // force the getCanvas() function to return the fake `editor`
    jest
      .spyOn(element, 'getCanvas')
      .mockReturnValue(editor)
  })

  it('should always be executable', () => {
    const command = new CommandSetInputCount(element, 3)

    expect(command.canExecute()).toEqual(true)
  })

  it('should maintain the two input connections if a port is added', () => {
    const command = new CommandSetInputCount(element, 3)

    command.execute()

    expect(element.getInputPort(0).parent.id).toEqual(element.id)
    expect(element.getInputPort(1).parent.id).toEqual(element.id)
    expect(element.getInputPort(2).parent.id).toEqual(element.id)
  })

  it('should remove the existing input if a port is removed', () => {
    const command = new CommandSetInputCount(element, 1)

    command.execute()

    expect(element.getInputPort(0).parent.id).toEqual(element.id)
    expect(element.getInputPort(1)).not.toBeDefined()
  })

  it('should re-apply the original two input connections if the command is undone', () => {
    const command = new CommandSetInputCount(element, 1)

    command.execute()

    expect(element.getInputPort(0).parent.id).toEqual(element.id)
    expect(element.getInputPort(1)).not.toBeDefined()

    command.undo()

    expect(element.getInputPort(0).parent.id).toEqual(element.id)
    expect(element.getInputPort(1).parent.id).toEqual(element.id)
  })
})
