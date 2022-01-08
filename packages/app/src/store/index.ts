import { createStore } from 'vuex'
import Vue from 'vue'
import rotate from '../layout/rotate'

const state = {
  selection: {
    rotation: 0,
    position: {
      x: 0,
      y: 0
    },
    items: []
  },
  activePort: null,
  portSnapHelperIds: [],
  connections: [
    { source: 'b', target: 'fp1' },
    { source: 'fp2', target: 'c' }
  ],
  zoomLevel: 1,
  ports: {
    a: {
      position: {
        x: 0,
        y: 0
      },
      type: 1, // 0 = output, 1 = input, 2 = freeport
      rotation: 0,
      orientation: 0, // [0, 1, 2, 3] = [left, top, right, bottom]
      showHelper: false
    },
    b: {
      position: {
        x: 0,
        y: 0
      },
      type: 0,
      rotation: 0,
      orientation: 2,
      showHelper: false
    },
    c: {
      position: {
        x: 0,
        y: 0
      },
      type: 0,
      rotation: 0,
      orientation: 1,
      showHelper: false
    },
    d: {
      position: {
        x: 0,
        y: 0
      },
      type: 1,
      rotation: 0,
      orientation: 3,
      showHelper: false
    },
    fp1: {
      position: {
        x: 0,
        y: 0
      },
      type: 2,
      rotation: 0,
      orientation: 0,
      showHelper: false
    },
    fp2: {
      position: {
        x: 0,
        y: 0
      },
      type: 2,
      rotation: 0,
      orientation: 2,
      showHelper: false
    }
  },
  elements: {
    abc: {
      type: 'Element',
      portIds: ['a', 'b'],
      position: { x: 300, y: 300 },
      rotation: 0,
      isSelected: false,
      properties: {
        inputCount: 1
      }
    },
    def: {
      type: 'Element',
      portIds: ['d'],
      position: { x: 900, y: 900 },
      rotation: 0,
      isSelected: false,
      properties: {
        inputCount: 1
      }
    },
    ghi: {
      type: 'Element',
      portIds: ['c'],
      position: { x: 650, y: 650 },
      rotation: 0,
      isSelected: false,
      properties: {
        inputCount: 1
      }
    },
    freeport1: {
      type: 'Freeport',
      portIds: ['fp1', 'fp2'],
      position: { x: 500, y: 500 },
      rotation: 0,
      isSelected: false,
    }
  }
}

const getters = {
  zoom (state) {
    return state.zoomLevel
  },

  selection (state) {
    return state.selection
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

  selectedItems (state, getters) {
    return getters
      .elements
      .filter(({ isSelected }) => isSelected)
  },

  unselectedItems (state, getters) {
    return getters
      .elements
      .filter(({ isSelected }) => !isSelected)
  },

  connections (state) {
    const { ports } = state

    return state
      .connections
      .map(({ source, target }) => ({
        source: {
          id: source,
          ...ports[source]
        },
        target: {
          id: target,
          ...ports[target]
        }
      }))
      .filter(({ source, target }) => source && target)
  }
}

const actions = {
  setZoom ({ commit }, zoom) {
    commit('SET_ZOOM', zoom)
  },

  createFreeport ({ commit }, data) {
    commit('CREATE_FREEPORT_ELEMENT', {
      itemId: data.itemId,
      inputPortId: data.inputPortId,
      outputPortId: data.outputPortId,
      position: data.position
    })
    commit('DISCONNECT', {
      source: data.sourceId,
      target: data.targetId
    })
    commit('CONNECT', {
      source: data.sourceId,
      target: data.outputPortId
    })
    commit('CONNECT', {
      source: data.inputPortId,
      target: data.targetId
    })
  },

  setActivePort ({ commit }, port) {
    commit('SET_ACTIVE_PORT', port)
  },

  showPortSnapHelpers ({ commit, getters }, movingPortIds) {
    const portIds = getters
      .connections
      .filter(({ source, target }) => {
        return movingPortIds.includes(source.id) || movingPortIds.includes(target.id)
      })
      .map(({ source, target }) => {
        return movingPortIds.includes(source.id)
          ? target.id
          : source.id
      })

    commit('SHOW_PORT_SNAP_HELPERS', portIds)
  },

  hidePortSnapHelpers ({ commit }) {
    commit('SHOW_PORT_SNAP_HELPERS', [])
  },

  rotateSelection ({ commit, state }, rotation) {
    const { items } = state.selection

    if (items.length >= 1) {
      if (items.length === 1) {
        commit('ROTATE_ITEM', {
          id: items[0].id,
          rotation
        })
      } else {
        commit('ROTATE_SELECTION', rotation)
      }
    }
  },

  connect ({ commit }, { source, target }) {
    commit('CONNECT', { source, target })
  },

  disconnect ({ commit }, { source, target }) {
    commit('DISCONNECT', { source, target })
  },

  selectItems ({ commit }, ids) {
    commit('GROUP_ITEMS', ids)
  },

  selectAll ({ commit, state }) {
    commit('GROUP_ITEMS', Object.keys(state.elements))
  },

  deselectAll ({ commit }) {
    commit('UNGROUP')
  },

  updateRotatedPositions ({ commit }, positions) {
    commit('UPDATE_ROTATED_POSITIONS', positions)
  },

  updatePortPositions ({ commit }, portPositions) {
    commit('UPDATE_PORT_POSITIONS', portPositions)
  },

  updateGroupItemPositions ({ commit }, elements) {
    elements.forEach((element) => {
      commit('UPDATE_POSITION', element)
    })
  },

  updateItemPosition ({ commit }, { id, position }) {
    commit('UPDATE_POSITION', { id, position })
  },

  updateProperties ({ commit }, { id, properties }) {
    commit('UPDATE_PROPERTIES', { id, properties })
  }
}

const mutations = {
  'SHOW_PORT_SNAP_HELPERS' (state, portIds) {
    Object
      .keys(state.ports)
      .forEach((portId: string) => {
        state.ports[portId].showHelper = portIds.includes(portId)
      })
  },

  'SET_ZOOM' (state, zoom) {
    state.zoomLevel = zoom
  },

  'SET_ACTIVE_PORT' (state, port) {
    state.activePort = port
  },

  'CONNECT' (state, { source, target }) {
    if (source && target) {
      state.connections.push({ source, target })
    }
  },

  'DISCONNECT' (state, { source, target }) {
    const connection = state.connections.findIndex((c: any) => {
      return c.source === source && c.target === target
    })

    if (connection >= 0) {
      state.connections.splice(connection, 1)
    }
  },

  'GROUP_ITEMS' (state, ids) {
    const itemsToGroup = ids.map((id: string) => state.elements[id])

    const position: any = itemsToGroup
      .reduce((data: any, item: any) => ({
        x: Math.min(data.x, item.position.x),
        y: Math.min(data.y, item.position.y)
      }), {
        x: Infinity,
        y: Infinity
      })

    itemsToGroup.forEach((el: any, index: number) => {
      el.id = ids[index]
      el.isSelected = true
      el.position.x -= position.x
      el.position.y -= position.y
    })

    state.selection.position = position
    state.selection.items = itemsToGroup
    state.selection.destroyed = false
  },

  'UNGROUP' (state) {
    const { position, items } = state.selection

    items.forEach(({ id }) => {
      const el = (state.elements[id] as any)

      el.isSelected = false
      el.position.x += position.x
      el.position.y += position.y
    })

    state.selection.items = []
    state.selection.rotation = 0
  },

  'CREATE_FREEPORT_ELEMENT' (state, { itemId, inputPortId, outputPortId, position }) {
    const createPort = (type, orientation) => ({
      position: {
        x: 0,
        y: 0
      },
      type: 2,
      rotation: 0,
      orientation
    })

    state.elements[itemId] = {
      type: 'Freeport',
      portIds: [inputPortId, outputPortId],
      position,
      rotation: 0,
      isSelected: false
    }
    state.ports[outputPortId] = createPort(0, 0)
    state.ports[inputPortId] = createPort(1, 2)
    // Vue.set(state.ports, outputPortId, createPort(0, 0))
    // Vue.set(state.ports, inputPortId, createPort(1, 2))
  },

  'ROTATE_SELECTION' (state, rotation) {
    state.selection.rotation = rotate(state.selection.rotation, rotation)
  },

  'ROTATE_ITEM' (state, { id, rotation }) {
    state.elements[id].rotation = rotate(state.elements[id].rotation, rotation)
  },

  'UPDATE_ROTATED_POSITIONS' (state, positions) {
    positions.forEach(({ id, position }) => {
      const el = (state.elements[id] as any)

      el.position.x = position.x - state.selection.position.x
      el.position.y = position.y - state.selection.position.y

      el.rotation = rotate(state.selection.rotation, el.rotation)

      // update the rotation of each port to match the item's rotation
      el.portIds.forEach((portId) => {
        state.ports[portId].rotation = el.rotation
      })
    })

    state.selection.rotation = 0
  },

  'UPDATE_PORT_POSITIONS' (state, portPositions) {
    Object
      .keys(portPositions)
      .forEach((portId: string) => {
        state.ports = {
          ...state.ports,
          [portId]: {
            ...state.ports[portId],
            ...portPositions[portId]
          }
        }
      })
  },

  'UPDATE_POSITION' (state, { id, position }) {
    if (id === 'SELECTION') {
      state.selection.position = position
    }

    if (state.elements[id]) {
      state.elements[id].position = position
    }
  },

  'UPDATE_PROPERTIES' (state, { id, properties }) {
    if (state.elements[id]) {
      state.elements[id].properties = {
        ...state.elements[id].properties,
        ...properties
      }
    }
  }
}

export default createStore({
  state,
  mutations,
  getters,
  actions
});
