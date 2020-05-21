<template>
  <div :style="style" class="grid">

    <wire
      v-for="(connection, key) in connections"
      :key="key"
      :source="connection.source"
      :target="connection.target"
    />

    <group v-for="(group, groupId) in groups" :ref="`group_${groupId}`" :items="group" :key="groupId" :id="groupId" @drag="groupDrag" @dragEnd="dragEnd" :position="groupDimensions[groupId].position" :rotation="groupDimensions[groupId].rotation" @updateGroupItemPositions="updateGroupItemPositions"
      @portDrag="groupDrag" @portDragStart="portDragStart" @portDragEnd="portDragEnd" @updateProperties="updateProperties">
    </group>

    <group v-for="item in nongroupItems" :items="[item]" :key="item.id" :id="item.id" @drag="groupDrag" @dragEnd="dragEnd" :position="item.position" :rotation="item.rotation"
      @portDrag="groupDrag" @portDragStart="portDragStart" @portDragEnd="portDragEnd" @updateProperties="updateProperties">
      <!-- <item :ports="item.ports" @portDrag="groupDrag" @portDragStart="portDragStart" @portDragEnd="portDragEnd" :activePortType="activePortType">
      </item> -->
    </group>

    <input type="checkbox" v-model="snapToGrid.enabled" value="1" /> Snap to grid<br />
    Grid size: <input type="number" v-model.number="snapToGrid.size" />

    Rotation: <input type="number" size="1" v-model.number="settings.rotation" @change="rotate" />

    <button @click="groupItems">Group</button>
    <button @click="ungroupItems">Ungroup</button>

    <pre>{{ JSON.stringify(connections, null, 2) }}</pre>
    <strong>NON_GROUPS:</strong>
    <pre>{{ JSON.stringify(fileData.ports, null, 2) }}</pre>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import Draggable from './Draggable.vue'
import Port from './Port.vue'
import Wire from './Wire.vue'
import Group from './Group.vue'
import Item from './Item.vue'

@Component({
  components: {
    Draggable,
    Port,
    Wire,
    Group,
    Item
  }
})
export default class List extends Vue {
  snapToGrid = {
    enabled: true,
    size: 20
  }

  settings = {
    rotation: 0
  }

  rotate () {
    const id = Object
      .values(this.groupDimensions)
      .forEach((g: any) => {
        g.rotation = this.settings.rotation
      })
  }

  activePortType: any = null

  get style () {
    if (!this.snapToGrid.enabled) return
    return {
      backgroundSize: `${this.snapToGrid.size}px ${this.snapToGrid.size}px`
    }
  }

  get connections () {
    const { ports } = this.fileData

    return this
      .fileData
      .connections
      .map(({ source, target }) => ({
        source: ports[source],
        target: ports[target]
      }))
      .filter(({ source, target }) => source && target)
  }

  connect ({ source, target }) {
    this.fileData.connections.push({ source, target })
  }

  disconnect ({ source, target }) {
    const connection = this.fileData.connections.findIndex((c: any) => {
      return c.source === source && c.target === target
    })

    if (connection >= 0) {
      this.fileData.connections.splice(connection, 1)
    }
  }

  portDragStart ({ source, target }) {
    console.log('portDragStart')
    this.connect({ source, target })
    this.activePortType = 'output' // should be 'input' or 'output'
  }

  portDragEnd ({ source, oldTarget, newTarget }) {
    this.disconnect({ source, target: oldTarget })

    if (newTarget) {
      this.connect({ source, target: newTarget })
    }
    this.activePortType = null

    delete this.fileData.ports['DRAGGED_PORT']
  }

  rotation: number = 0

  connectPrompt: any = {
    source: 'c',
    target: 'd'
  }

  groupDimensions: any = {}

  groupItems () {
    const itemsToGroup = Object.values(this.fileData.elements)
    const groupId = 'TEST_GROUP'

    const position = itemsToGroup.reduce((data, item) => ({
      x: Math.min(data.x, item.position.x),
      y: Math.min(data.y, item.position.y)
    }), {
      x: Infinity,
      y: Infinity
    })

    itemsToGroup.forEach((el: any) => {
      el.groupId = groupId
      el.position.x -= position.x
      el.position.y -= position.y
    })

    this.groupDimensions[groupId] = {
      rotation: 0,
      position
    }
  }

  ungroupItems () {
    const groupId = 'TEST_GROUP'
    const group = this.groupDimensions[groupId]

    const gr = this.$refs[`group_${groupId}`]

    if (gr) {
      // console.log('console: ', (this.$refs[`group_${groupId}`] as any).$emit)

      (this.$refs[`group_${groupId}`][0] as any).updateItemPositions()
    }

    Object
      .keys(this.fileData.elements)
      .filter((key: string) => {
        return this.fileData.elements[key].groupId === groupId
      })
      .forEach((key: string) => {
        const el = (this.fileData.elements[key] as any)

        el.groupId = null
        el.rotation += group.rotation
        console.log('NEW ROT', el.rotation, group.rotation)
        // el.position.x += group.x
        // el.position.y += group.y
      })

    // this.groupDimensions[groupId] = null
  }

  fileData = {
    ports: {
      ...['a', 'b', 'c', 'd'].reduce((l, k) => ({
        ...l,
        [k]: {
          position: {
            x: 0,
            y: 0
          }
        }
      }), {})
    },
    groups: [] as any,
    connections: [{
      source: 'a',
      target: 'c'
    }] as any,
    elements: {
      abc: {
        portIds: ['a', 'b'],
        position: { x: 100, y: 200 },
        rotation: 0,
        groupId: null,
        properties: {
          inputCount: 1
        }
      },
      def: {
        portIds: ['d'],
        position: { x: 0, y: 0 },
        rotation: 0,
        groupId: null,
        properties: {
          inputCount: 1
        }
      },
      ghi: {
        portIds: ['c'],
        position: { x: 50, y: 30 },
        rotation: 0,
        groupId: null,
        properties: {
          inputCount: 1
        }
      }
    }
  }

  mounted () {
  }

  get elements () {
    return Object
      .keys(this.fileData.elements)
      .map((elementId: string) => ({
        ...this.fileData.elements[elementId],
        id: elementId,
        ports: this
          .fileData
          .elements[elementId]
          .portIds
          .map((portId: string) => ({
            id: portId,
            ...this.fileData.ports[portId]
          }))
      }))
  }

  get groups () {
    return this
      .elements
      .reduce((groups, element) => {
        if (element.groupId) {
          return {
            ...groups,
            [element.groupId]: [
              ...(groups[element.groupId] || []),
              element
            ]
          }
        }

        return groups
      }, {})
  }

  get nongroupItems () {
    const es = this
      .elements
      .filter(({ groupId }) => !groupId)


      return es
  }

  groupDrag (portPositions) { // points = port positions
  // console.log(JSON.stringify(portPositions, null, 2))
    Object
      .keys(portPositions)
      .forEach((portId: string) => {
        this.fileData.ports = {
          ...this.fileData.ports,
          [portId]: {
            ...this.fileData.ports[portId],
            ...portPositions[portId]
          }
        }
      })
  }

  updateGroupItemPositions (elements) {
    elements.forEach(this.dragEnd)
  }

  dragEnd ({ id, position }) {
    if (this.groupDimensions[id]) {
      this.groupDimensions[id].position = position
    }

    if (this.fileData.elements[id]) {
      this.fileData.elements[id].position = position
    }
  }

  updateProperties ({ id, properties }) {
    if (this.fileData.elements[id]) {
      this.fileData.elements[id].properties = {
        ...this.fileData.elements[id].properties,
        ...properties
      }
    }
  }
}
</script>

<style lang="scss">

body {
  padding: 0;
  margin: 0;
}

.grid {
  width: 100vw;
  height: 100vh;
  background-image:
    linear-gradient(to right, #e8e8e8 1px, transparent 1px),
    linear-gradient(to bottom, #e8e8e8 1px, transparent 1px);
}
</style>
