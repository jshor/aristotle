import Vue from 'vue'

const state = {
  selection: {
    rotation: 0,
    position: {
      x: 0,
      y: 0
    },
    destroyed: true,
    items: []
  },
  activePort: null,
  connections: [
    {
      source: 'c',
      target: 'a'
    }
  ],
  ports: {
    a: {
      position: {
        x: 0,
        y: 0
      },
      type: 1, // 0 = output, 1 = input
      orientation: 0 // [0, 1, 2, 3] = [left, top, right, bottom]
    },
    b: {
      position: {
        x: 0,
        y: 0
      },
      type: 0,
      orientation: 2
    },
    c: {
      position: {
        x: 0,
        y: 0
      },
      type: 0,
      orientation: 2
    },
    d: {
      position: {
        x: 0,
        y: 0
      },
      type: 0,
      orientation: 2
    }
  },
  elements: {
    abc: {
      portIds: ['a', 'b'],
      position: { x: 300, y: 300 },
      rotation: 0,
      isSelected: false,
      properties: {
        inputCount: 1
      }
    },
    def: {
      portIds: ['d'],
      position: { x: 100, y: 100 },
      rotation: 0,
      isSelected: false,
      properties: {
        inputCount: 1
      }
    },
    ghi: {
      portIds: ['c'],
      position: { x: 500, y: 500 },
      rotation: 0,
      isSelected: false,
      properties: {
        inputCount: 1
      }
    }
  }
}

const getters = {
  selection (state) {
    return state.selection
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
        source: ports[source],
        target: ports[target]
      }))
      .filter(({ source, target }) => source && target)
  }
}

const actions = {
  setActivePort ({ commit }, port) {
    commit('SET_ACTIVE_PORT', port)
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

  selectItems ({ commit, state }, ids) {
    if (!state.selection.destroyed) {
      // if an active selection is present, it must be destroyed first
      commit('DESTROY_GROUP')
    } else {
      commit('GROUP_ITEMS', ids)
    }
  },

  destroySelection ({ commit }) {
    commit('DESTROY_GROUP')
  },

  deselectAll ({ commit }, positions) {
    commit('UNGROUP', positions)
  },

  updatePortPositions ({ commit }, portPositions) { // points = port positions
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
  'SET_ACTIVE_PORT' (state, port) {
    state.activePort = port
  },

  'ROTATE_SELECTION' (state, rotation) {
    state.selection.rotation += rotation
  },

  'ROTATE_ITEM' (state, { id, rotation }) {
    state.elements[id].rotation += rotation
  },

  'CONNECT' (state, { source, target }) {
    state.connections.push({ source, target })
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
    const itemsToGroup = Object
      .keys(state.elements)
      .filter((id: string) => ids.includes(id))
      .map((id: string) => state.elements[id])

    const position: any = itemsToGroup
      .reduce((data: any, item: any) => ({
        x: Math.min(data.x, item.position.x),
        y: Math.min(data.y, item.position.y)
      }), {
        x: Infinity,
        y: Infinity
      })

    itemsToGroup.forEach((el: any) => {
      el.isSelected = true
      el.position.x -= position.x
      el.position.y -= position.y
    })

    state.selection.position = position
    state.selection.items = itemsToGroup
    state.selection.destroyed = false
  },

  'DESTROY_GROUP' (state) {
    state.selection.destroyed = true
  },

  'UNGROUP' (state, positions) {
    positions.forEach(({ id, position }) => {
      const el = (state.elements[id] as any)

      el.isSelected = false
      el.rotation += state.selection.rotation
      el.position.x = position.x
      el.position.y = position.y
    })

    state.selection.items = []
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

export default {
  state,
  getters,
  actions,
  mutations
}
