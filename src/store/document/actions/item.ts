import { v4 as uuid } from 'uuid'
import { DocumentStoreInstance } from '..'
import boundaries from '../geometry/boundaries'
import PortType from '@/types/enums/PortType'
import Direction from '@/types/enums/Direction'
import fromDocumentToEditorCoordinates from '@/utils/fromDocumentToEditorCoordinates'
import Port from '@/types/interfaces/Port'
import ItemProperties from '@/types/interfaces/ItemProperties'
import Item from '@/types/interfaces/Item'
import Point from '@/types/interfaces/Point'
import { getSequencedName } from '@/utils/getSequencedName'
import portFactory from '@/factories/portFactory'

/**
 * Adds any non-IC component to the state.
 *
 * @param payload
 * @param payload.item - new item to add
 * @param payload.ports - mapping of IDs-to-ports, containing a subset of ports belonging to the new item
 */
export function addItem (this: DocumentStoreInstance, { item, ports }: { item: Item, ports: Record<string, Port> }) {
  // add all ports associated to this item
  // if the item is an integrated circuit, only add the ports that it defines (ones visible to the user)
  const portList = item.integratedCircuit?.ports || ports

  item.isSelected = false

  this.items[item.id] = item
  this.items[item.id].zIndex = ++this.zIndex

  this.addVirtualNode(item, portList)
  this.setItemBoundingBox(item.id)

  item
    .portIds
    .forEach(id => this.addPort(item.id, portList[id]))

  this.resetItemValue(item)
  this.addClock(item)
  this.setItemName(item, item.name)
}

/**
 * Sets the item's name.
 * If the name already exists in the document, a sequenced name will be generated.
 * Example: 'MyNode', 'MyNode 2', etc.
 */
export function setItemName (this: DocumentStoreInstance, item: Item, name?: string) {
  if (!item.properties.name) return // do nothing if the item cannot have its name defined

  const itemNames = new Set(
    Object
      .values(this.items)
      .filter(({ name, id }) => name && item.id !== id)
      .map(({ name }) => name)
  )

  if (!name || itemNames.has(name)) {
    item.name = getSequencedName(item.defaultName, itemNames)
  } else {
    item.name = name
  }

  item.properties.name.value = item.name
  item.portIds.forEach(id => this.setPortName(id))
}

/**
 * Inserts the given item and its ports into the document.
 * If no document position is given, the item will be placed in the center of the viewport.
 */
export function insertItemAtPosition (this: DocumentStoreInstance, { item, ports }: { item: Item, ports?: Record<Direction, Port[]> }, documentPosition: Point | null = null) {
  if (!documentPosition) {
    const midpoint = boundaries.getBoundingBoxMidpoint(this.viewport)

    documentPosition = {
      x: midpoint.x + this.viewport.left,
      y: midpoint.y + this.viewport.top
    }
  }

  if (documentPosition.x < this.viewport.left || documentPosition.x > this.viewport.right ||
    documentPosition.y < this.viewport.top || documentPosition.y > this.viewport.bottom) {
    return // do not add the item if it is outside the viewport
  }

  const position = fromDocumentToEditorCoordinates(this.canvas, this.viewport, documentPosition, this.zoomLevel)

  position.x -= item.width / 2
  position.y -= item.height / 2

  item.position = position

  this.commitState()
  this.addItem({
    item,
    ports: Object
      .values(ports || {})
      .reduce((map: Record<string, Port>, ports) => {
        return ports.reduce((m, port) => ({ ...m, [port.id]: port }), map)
      }, {})
  })
  this.setItemBoundingBox(item.id)
  this.setItemSelectionState(item.id, true)
}

/**
 * Resets the item output value to its predefined start value (if any).
 */
export function resetItemValue (this: DocumentStoreInstance, item: Item) {
  const property = item.properties?.startValue

  if (!property) return

  const value = property.value as number

  item.portIds.forEach(id => this.setPortValue({ id, value }))
}

/**
 * Removes an element and all its associated ports and circuit nodes from the state.
 */
export function removeElement (this: DocumentStoreInstance, id: string) {
  const item = this.items[id]

  if (!item) return

  this.removeVirtualNode(item.id)
  this.oscillator.remove(item.clock!)
  this.selectedItemIds.delete(item.id)

  // remove all ports associated with the item
  const ids = [...item.portIds]

  ids.forEach(portId => this.removePort(portId))

  // remove the item
  delete this.items[id]
}

/**
 * Sets the number of input ports that a LogicGate should have.
 * If the number is less than the current number of ports, take away the difference number of existing ports.
 */
export function setInputCount (this: DocumentStoreInstance, id: string, count: number) {
  const currentInputPorts = this
    .items[id]
    .portIds
    .filter(portId => this.ports[portId].type === PortType.Input)

  if (currentInputPorts.length > count) {
    // if the count has decreased, find the last remaining port IDs which will be removed
    currentInputPorts
      .slice(count)
      .forEach(portId => this.removePort(portId))
  }

  if (currentInputPorts.length < count) {
    // if the count has increased, figure out how many ports need to be added and add them
    for (let i = currentInputPorts.length; i < count; i++) {
      const portId = uuid()

      this.addPort(id, portFactory(id, portId, Direction.Left, PortType.Input))
      this.setPortName(portId)
    }
  }
}
