import IPoint from '@/interfaces/IPoint'
import { createStore } from 'vuex'
import rotate from '../layout/rotate'
import sample from './sample'

const rand = () => `id_${(Math.floor(Math.random() * 100) + 5)}` // TODO: use uuid

const state = {
  activePort: null,
  snapBoundaries: [],
  connectablePortIds: [],
  ...sample
}

const getters = {
  zoom (state) {
    return state.zoomLevel
  },

  ports (state) {
    return state.ports
  },

  elements (state) {
    return Object
      .keys(state.elements)
      .map((elementId: string) => ({
        ...state.elements[elementId],
        id: elementId,
        ports: state
          .elements[elementId]
          .portIds
          .map((portId: string) => ({
            id: portId,
            ...state.ports[portId]
          }))
      }))
  },

  connections (state) {
    const { ports } = state

    return Object
      .values(state.connections)
      .map((wire: any) => ({
        ...wire,
        source: {
          id: wire.source,
          ...ports[wire.source]
        },
        target: {
          id: wire.target,
          ...ports[wire.target]
        }
      }))
      .filter(({ source, target }) => source && target)
  },

  nextZIndex (state) {
    return Object.keys(state.elements).length + Object.keys(state.connections).length
  }
}

const actions = {
  setZoom ({ commit }, zoom) {
    commit('SET_ZOOM', zoom)
  },

  addElement ({ commit, dispatch }, { element, ports }: { element: any, ports: any[] }) {
    commit('ADD_ELEMENT', { element, ports })
    dispatch('setElementPortPositions', element.id)
  },

  removeElement ({ commit, state }, id: string) {
    const element = state.elements[id]

    if (!element) return

    // remove all connections first
    const connections: any[] = Object
      .values(state.connections)
      .filter((connection: any) => element.portIds.includes(connection.source) || element.portIds.includes(connection.target))

    connections.forEach((connection: any) => {
      commit('DISCONNECT', {
        source: connection.source,
        target: connection.target
      })
    })

    if (element.type === 'Freeport' && connections.length === 2) {
      // if this is a freeport, then reconnect the two disconnected wires
      commit('CONNECT', {
        source: connections[0].source,
        target: connections[1].target
      })
    }

    // remove the element
    commit('REMOVE_ELEMENT', id)
  },

  setSnapBoundaries ({ commit, state }, id: string) {
    const snapBoundaries = (() => {
      const element = state.elements[id]

      if (element && element.groupId === null) {
        // the item with the given id is an element that does not belong to a group
        if (element.type === 'Freeport') {
          console.log('it is an freeport', id, element.portIds.length)
          if (element.portIds.length > 1) {
            // if only one port exists on the freeport, then it is a port being dragged by the user and does not apply
            // find all connectable ports and set their boundaries
            const createPortSnapBoundaries = port => ([
              {
                left: port.position.x,
                right: port.position.x,
                top: -Infinity,
                bottom: Infinity
              },
              {
                left: -Infinity,
                right: Infinity,
                top: port.position.y,
                bottom: port.position.y
              }
            ])

            // freeports should snap to "straighten out" wires
            return Object
              .values(state.connections)
              .reduce((ports: any[], connection: any) => {
                if (element.portIds.includes(connection.source)) {
                  return ports.concat(createPortSnapBoundaries(state.ports[connection.target]))
                }

                if (element.portIds.includes(connection.target)) {
                  return ports.concat(createPortSnapBoundaries(state.ports[connection.source]))
                }

                return ports
              }, [])
          }
        } else {
          // this an element that can snap to align with the outer edge of any non-freeport element
          return Object
            .values(state.elements)
            .filter((e: any) => e.id !== id && e.type !== 'Freeport')
            .map((e: any) => e.boundingBox)
        }
      }
      return []
    })()

    console.log('SNAP TO: ', snapBoundaries)

    commit('SET_SNAP_BOUNDARIES', snapBoundaries)
  },

  setElementSize ({ commit, dispatch, state }, { rect, id }: { rect: DOMRectReadOnly, id: string }) {
    const element = state.elements[id]

    if (!element) return

    // reposition w.r.t. the centroid
    const centerX = element.position.x + (element.width / 2)
    const centerY = element.position.y + (element.height / 2)
    const newX = centerX - (rect.width / 2)
    const newY = centerY - (rect.height / 2)

    commit('SET_ELEMENT_POSITION', {
      id,
      position: {
        x: newX,
        y: newY
      }
    })
    commit('SET_ELEMENT_SIZE', { rect, id })

    dispatch('setElementBoundingBox', id)
    dispatch('setElementPortPositions', id)

    if (state.elements[id].groupId) {
      dispatch('setGroupBoundingBox', state.elements[id].groupId)
    }
  },

  setElementPortPositions ({ commit, state }, id: string) {
    const element = state.elements[id]

    if (!element) return

    const { left, top, bottom, right } = element.boundingBox
    const portGroups = element
      .portIds
      .reduce((portGroups, portId) => {
        const port = state.ports[portId]

        if (port) {
          const index = rotate(port.orientation + element.rotation)

          portGroups[index].push({ ...port, portId })
        }

        return portGroups
      }, {
        0: [],
        1: [],
        2: [],
        3: []
      })

    const setPortGroupPositions = (ports) => {
      ports.forEach(port => {
        const spacing = (port.orientation + element.rotation) % 2 === 0
          ? Math.floor((bottom - top) / (ports.length + 1))
          : Math.floor((right - left) / (ports.length + 1))
        const position = (() => {
          switch (rotate(port.orientation + element.rotation)) {
            case 0:
              return { x: left, y: top + spacing }
            case 1:
              return { x: left + spacing, y: top }
            case 2:
              return { x: right, y: top + spacing }
            case 3:
              return { x: left + spacing, y: bottom }
          }
        })()

        commit('SET_PORT_POSITION', {
          id: port.portId,
          position
        })
      })
    }

    setPortGroupPositions(portGroups[0])
    setPortGroupPositions(portGroups[1])
    setPortGroupPositions(portGroups[2])
    setPortGroupPositions(portGroups[3])
  },

  moveElementPosition ({ commit, dispatch, state }, { id, delta, isMovedByGroup = false }: { id: string, delta: IPoint, isMovedByGroup: boolean }) {
    const element = state.elements[id]

    if (!element) return

    if (element.groupId && !isMovedByGroup) {
      // if the element is part of a group, move the entire group instead
      return dispatch('moveGroupPosition', { id: element.groupId, delta })
    }

    commit('SET_ELEMENT_POSITION', {
      id,
      position: {
        x: element.position.x + delta.x,
        y: element.position.y + delta.y
      }
    })

    commit('SET_ELEMENT_BOUNDING_BOX', {
      id,
      boundingBox: {
        left: element.boundingBox.left + delta.x,
        top: element.boundingBox.top + delta.y,
        bottom: element.boundingBox.bottom + delta.y,
        right: element.boundingBox.right + delta.x
      }
    })

    element
      .portIds
      .forEach((portId) => {
        const port = state.ports[portId]

        if (!port) return

        commit('SET_PORT_POSITION', {
          id: portId,
          position: {
            x: port.position.x + delta.x,
            y: port.position.y + delta.y
          }
        })
      })
  },

  moveGroupPosition ({ commit, dispatch, state }, { id, delta }) {
    const group = state.groups[id]

    commit('SET_GROUP_BOUNDING_BOX', {
      boundingBox: {
        left: group.boundingBox.left + delta.x,
        top: group.boundingBox.top + delta.y,
        right: group.boundingBox.right +  delta.x,
        bottom: group.boundingBox.bottom + delta.y
      },
      id
    })

    group
      .elementIds
      .forEach(elementId => {
        const element = state.elements[elementId]

        dispatch('moveElementPosition', {
          id: element.id,
          isMovedByGroup: true,
          delta
        })
      })
  },

  setElementBoundingBox ({ commit, state }, id: string) {
    const element = state.elements[id]

    if (!element) return
    if (element.rotation % 2 === 0) {
      // element is right side up or upside down
      commit('SET_ELEMENT_BOUNDING_BOX', {
        id,
        boundingBox: {
          left: element.position.x,
          top: element.position.y,
          bottom: element.height + element.position.y,
          right: element.width + element.position.x
        }
      })
    } else {
      // element is rotated at a 90 degree angle (CW or CCW)
      const midX = element.position.x + (element.width / 2)
      const midY = element.position.y + (element.height / 2)

      commit('SET_ELEMENT_BOUNDING_BOX', {
        id,
        boundingBox: {
          left: midX - (element.height / 2),
          top: midY - (element.width / 2),
          right: midX + (element.height / 2),
          bottom: midY + (element.width / 2)
        }
      })
    }
  },

  setGroupBoundingBox ({ commit, state }, id: string) {
    if (!id) return
    const group = state.groups[id]
    const rect = group.elementIds.reduce((rect, id) => {
      const { boundingBox } = state.elements[id]

      return {
        left: Math.min(rect.left, boundingBox.left),
        top: Math.min(rect.top, boundingBox.top),
        right: Math.max(rect.right, boundingBox.right),
        bottom: Math.max(rect.bottom, boundingBox.bottom)
      }
    }, {
      left: Infinity,
      top: Infinity,
      right: 0,
      bottom: 0
    })

    commit('SET_GROUP_BOUNDING_BOX', { boundingBox: rect, id })
  },

  group ({ commit, dispatch, state }) {
    const id = rand()
    const elementIds = Object
      .keys(state.elements)
      .filter(id => state.elements[id].isSelected)
    const connectionIds = Object
      .keys(state.connections)
      .filter(id => state.connections[id].isSelected)

    commit('GROUP_ITEMS', { id, elementIds, connectionIds, isSelected: true })
    dispatch('setGroupBoundingBox', id)
  },

  ungroup ({ commit, state }) {
    for (const id in state.groups) {
      if (state.groups[id].isSelected) {
        commit('UNGROUP', id)
      }
    }
  },

  createSelection ({ commit, dispatch, state }, selection) {
    const scaled = {
      left: selection.left / state.zoomLevel,
      top: selection.top / state.zoomLevel,
      bottom: selection.bottom / state.zoomLevel,
      right: selection.right / state.zoomLevel
    }

    const elementIds = Object
      .keys(state.elements)
      .filter(id => {
        const { boundingBox } = state.elements[id]

        if (scaled.left >= boundingBox.right || boundingBox.left >= scaled.right) {
          // one rect is on left side of other
          return false
        }

        if (scaled.top >= boundingBox.bottom || boundingBox.top >= scaled.bottom) {
          // one rect is above other
          return false
        }

        return true
      })

    elementIds.forEach(id => {
      commit('SET_SELECTION_STATE', { id, isSelected: true })
    })

    dispatch('selectConnections', elementIds)
  },

  selectConnections ({ commit, state }, elementIds: string[]) {
    const portIds = elementIds.reduce((portIds: string[], elementId: string) => {
      return portIds.concat(state.elements[elementId].portIds)
    }, [])

    for (let id in state.connections) {
      const c = state.connections[id]

      if (portIds.includes(c.source) || portIds.includes(c.target)) {
        commit('SET_SELECTION_STATE', { id, isSelected: true })
      }
    }
  },

  deselectAll ({ commit }) {
    commit('SET_ALL_SELECTION_STATES', false)
  },

  selectAll ({ commit }) {
    commit('SET_ALL_SELECTION_STATES', true)
  },

  toggleSelectionState ({ commit, state }, { id, forcedValue = null }: { id: string, forcedValue: boolean | null }) {
    const item = state.elements[id] || state.connections[id] || state.groups[id]
    const isSelected = forcedValue === null
      ? !item.isSelected
      : forcedValue

    if (item.groupId !== null) {
      // if item is part of a group, select all items in that group
      const { elementIds, connectionIds } = state.groups[item.groupId]

      elementIds
        .concat(connectionIds)
        .forEach(id => {
          commit('SET_SELECTION_STATE', { id, isSelected })
        })

      commit('SET_SELECTION_STATE', { id: item.groupId, isSelected })
    } else {
      // otherwise, just select this one item
      commit('SET_SELECTION_STATE', { id, isSelected })
    }
  },

  createFreeport ({ commit, dispatch }, data) {
    commit('CREATE_FREEPORT_ELEMENT', data)
    dispatch('setElementBoundingBox', data.itemId)

    if (data.sourceId && data.targetId) {
      commit('DISCONNECT', {
        source: data.sourceId,
        target: data.targetId
      })
    }

    if (data.sourceId) {
      commit('CONNECT', {
        source: data.sourceId,
        target: data.outputPortId,
        zIndex: getters.nextZIndex
      })
    }

    if (data.targetId) {
      commit('CONNECT', {
        source: data.inputPortId,
        target: data.targetId,
        zIndex: getters.nextZIndex
      })
    }
  },

  setConnectablePortIds ({ commit, state }, portId: string) {
    const port = state.ports[portId]

    if (port.isFreeport) return // freeports cannot connect to anything

    const connectedPortIds = Object
      .values(state.connections)
      .reduce((portIds: any[], connection: any) => {
        if (state.ports[portId].isFreeport) {
          return portIds
        }
        return portIds.concat([connection.source, connection.target])
      }, [])

    connectedPortIds.splice(-2) // remove the last two elements (the currently-dragged connection)

    const filter = port.type === 0
      ? (p: any) => p.type === 1 && !p.isFreeport && !connectedPortIds.includes(p.id)
      : (p: any) => p.type === 0 && !p.isFreeport && !connectedPortIds.includes(port.id)

    const portIds: string[] = []
    const snapBoundaries: any[] = []

    Object
      .values(state.ports)
      .filter(filter)
      .forEach(({ id, position }: any) => {
        snapBoundaries.push({
          left: position.x,
          top: position.y,
          right: position.x,
          bottom: position.y
        })
        portIds.push(id)
      })

    commit('SET_CONNECTABLE_PORT_IDS', portIds)
    commit('SET_SNAP_BOUNDARIES', snapBoundaries)
  },

  rotateFreeport ({ commit }, { id, rotation }: { id: string, rotation: number }) {
    commit('ROTATE_ELEMENT', { id, rotation })
  },

  connectFreeport ({ commit, dispatch, state }, { sourceId, targetId, portId }: { sourceId?: string, targetId?: string, portId: string }) {
    const port = state.ports[portId]
    const newPort: any = Object
      .values(state.ports)
      .find((p: any) => {
        const distX = Math.pow(p.position.x - port.position.x, 2)
        const distY = Math.pow(p.position.y - port.position.y, 2)

        return Math.sqrt(distX + distY) <= 10 && p.id !== portId && state.connectablePortIds.includes(p.id)
      })

    if (newPort) {
      const payload: any = {}

      if (sourceId) {
        payload.source = sourceId
        payload.target = newPort.id
      } else {
        payload.source = newPort.id
        payload.target = targetId
      }

      commit('CONNECT', payload)
    }

    const element: any = Object
      .values(state.elements)
      .find(({ portIds }: any) => portIds.includes(portId))

    dispatch('removeElement', element.id)
    commit('SET_CONNECTABLE_PORT_IDS', [])
  },

  rotate ({ commit, dispatch, state }, direction: number) {
    for (const id in state.groups) {
      const group = state.groups[id]

      if (group.isSelected) {
        // rotate all selected groups
        const w = group.boundingBox.right - group.boundingBox.left
        const h = group.boundingBox.bottom - group.boundingBox.top
        const mx = group.boundingBox.left + (w / 2)
        const my = group.boundingBox.top + (h / 2)

        group.elementIds.forEach(elementId => {
          const element = state.elements[elementId]
          const cx = element.position.x
          const cy = element.position.y
          const ax = cx + (element.width / 2)
          const ay = cy + (element.height / 2)
          const L = Math.sqrt(Math.pow((mx - ax), 2) + Math.pow((my - ay), 2))
          const currentAngleRad = Math.atan2((ay - my), (ax - mx))
          const newAngle = (90 * direction * (Math.PI / 180)) + currentAngleRad
          const newAx = (L * Math.cos(newAngle)) + mx
          const newAy = (L * Math.sin(newAngle)) + my

          const x = newAx - (element.width / 2)
          const y = newAy - (element.height / 2)

          const delta = {
            x: x - element.position.x,
            y: y - element.position.y
          }

          commit('ROTATE_ELEMENT', {
            id: elementId,
            rotation: rotate(element.rotation + direction)
          })
          dispatch('moveElementPosition', { id: elementId, delta, isMovedByGroup: true })
          dispatch('setElementBoundingBox', elementId)
          dispatch('setElementPortPositions', elementId)
        })

        dispatch('setGroupBoundingBox', id)
      }
    }

    for (const id in state.elements) {
      const element = state.elements[id]

      if (element.isSelected && element.groupId === null) {
        // rotate all selected, non-grouped items
        commit('ROTATE_ELEMENT', {
          id,
          rotation: rotate(element.rotation + direction)
        })
        dispatch('setElementBoundingBox', id)
        dispatch('setElementPortPositions', id)
      }
    }
  },

  connect ({ commit, getters }, { source, target }) {
    commit('CONNECT', { source, target, zIndex: getters.nextZIndex })
  },

  disconnect ({ commit }, { source, target }) {
    commit('DISCONNECT', { source, target })
  },

  selectItems ({ commit }, ids: string[]) {
    commit('GROUP_ITEMS', ids)
  },

  changeSelectionZIndex ({ commit, state }, fn: (i: any) => number) {
    state
      .selection
      .elements
      .concat(state.selection.connections)
      .forEach(item => {
        commit('SET_Z_INDEX', { item, zIndex: fn(item) })
      })
  },

  sendBackward ({ dispatch }) {
    dispatch('changeSelectionZIndex', (i: any) => i.zIndex - 1)
  },

  bringForward ({ dispatch }) {
    dispatch('changeSelectionZIndex', (i: any) => i.zIndex + 1)
  },

  sendToBack ({ dispatch, getters }) {
    dispatch('changeSelectionZIndex', (i: any) => getters.zIndex)
  },

  bringToFront ({ dispatch }) {
    dispatch('changeSelectionZIndex', (i: any) => 0)
  }
}

const mutations = {
  'ADD_ELEMENT' (state, { element, ports }: { element: any, ports: any[] }) {
    state.elements[element.id] = element

    ports.forEach(port => {
      state.ports[port.id] = port
    })
  },

  'REMOVE_ELEMENT' (state, id: string) {
    state.elements[id].portIds.forEach(portId => {
      delete state.ports[portId]
    })
    delete state.elements[id]
  },

  'SET_ELEMENT_SIZE' (state, { rect, id }: { rect: DOMRectReadOnly, id: string }) {
    state.elements[id].width = rect.width
    state.elements[id].height = rect.height
  },

  'SET_SNAP_BOUNDARIES' (state, snapBoundaries) {
    state.snapBoundaries = snapBoundaries
  },

  'SET_PORT_POSITION' (state, { id, position }) {
    state.ports[id].position = position
  },

  'SET_ELEMENT_POSITION' (state, { id, position }) {
    state.elements[id].position = position
  },

  'SET_ELEMENT_BOUNDING_BOX' (state, { boundingBox, id }: { boundingBox: any, id: string }) {
    state.elements[id].boundingBox = boundingBox
  },

  'SET_GROUP_BOUNDING_BOX' (state, { boundingBox, id }: { boundingBox: any, id: string }) {
    state.groups[id].boundingBox = boundingBox
  },

  'SET_ALL_SELECTION_STATES' (state, isSelected) {
    for (let id in state.connections) {
      state.connections[id].isSelected = isSelected
    }

    for (let id in state.elements) {
      state.elements[id].isSelected = isSelected
    }

    for (let id in state.groups) {
      state.groups[id].isSelected = isSelected
    }
  },

  'SET_SELECTION_STATE' (state, { id, isSelected }: { id: string, isSelected: boolean }) {
    if (state.elements[id]) {
      state.elements[id].isSelected = isSelected
    } else if (state.connections[id]) {
      state.connections[id].isSelected = isSelected
    } else if (state.groups[id]) {
      state.groups[id].isSelected = isSelected
    }
  },

  'SET_Z_INDEX' (state, { item, zIndex }) {
    let index = 0

    Object
      .values(state.connections)
      .concat(state.connections)
      .sort((a: any, b: any) => {
        // sort all connections and elements by their zIndexes
        if (a.zIndex > b.zIndex) return -1
        else if (a.zIndex < b.zIndex) return 1
        return 0
      })
      .forEach((i: any) => {
        const type = i.type ? 'elements' : 'connections'

        index++

        if (item.id === i.id) {
          state[type][i.id] = zIndex
          index++
        } else {
          state[type][i.id] = index
        }
      })
  },

  'SET_ZOOM' (state, zoom) {
    state.zoomLevel = zoom
  },

  'SET_CONNECTABLE_PORT_IDS' (state, connectablePortIds: string[]) {
    state.connectablePortIds = connectablePortIds
  },

  'CONNECT' (state, { source, target, zIndex }) {
    const id = `conn_${rand()}`

    if (source && target) {
      state.connections[id] = {
        id,
        source,
        target,
        zIndex,
        isSelected: false
      }
    }
  },

  'DISCONNECT' (state, { source, target }) {
    const connection: any = Object
      .values(state.connections)
      .find((c: any) => {
        return c.source === source && c.target === target
      })

    if (connection) {
      delete state.connections[connection.id]
    }
  },

  'GROUP_ITEMS' (state, group) {
    state.groups[group.id] = group

    // set the groupId of all elements in the group
    group.elementIds.forEach(id => {
      state.elements[id].groupId = group.id
    })

    // set the groupId of all connections in the group
    group.connectionIds.forEach(id => {
      state.connections[id].groupId = group.id
    })
  },

  'UNGROUP' (state, groupId: string) {
    const group = state.groups[groupId]

    // remove the groupId of all elements in the group and select them
    group.elementIds.forEach(id => {
      state.elements[id].groupId = null
      state.elements[id].isSelected = true
    })

    // remove the groupId of all connections in the group and select them
    group.connectionIds.forEach(id => {
      state.connections[id].groupId = null
      state.connections[id].isSelected = true
    })

    delete state.groups[groupId]
  },

  'CREATE_FREEPORT_ELEMENT' (state, { itemId, inputPortId, outputPortId, position }: { itemId: string, position: any, outputPortId?: string, inputPortId?: string }) {
    const createPort = (id, type, orientation) => ({
      id,
      type,
      orientation,
      isFreeport: true,
      position: {
        x: 0,
        y: 0
      },
      rotation: 0
    })
    const portIds: string[] = []

    if (inputPortId) {
      state.ports[inputPortId] = createPort(inputPortId, 1, 2) // TODO: pass orientation
      portIds.push(inputPortId)
    }

    if (outputPortId) {
      state.ports[outputPortId] = createPort(outputPortId, 0, 0)
      portIds.push(outputPortId)
    }

    state.elements[itemId] = {
      id: itemId,
      type: 'Freeport',
      portIds,
      position,
      rotation: 0,
      isSelected: true,
      groupId: null,
      zIndex: 3,
      width: 1,
      height: 1
    }
  },

  'ROTATE_ELEMENT' (state, { id, rotation }) {
    state.elements[id].rotation = rotation

    state
      .elements[id]
      .portIds
      .forEach(portId => {
        state.ports[portId].rotation = rotation
      })
  },
}

export default createStore({
  state,
  mutations,
  getters,
  actions
})
