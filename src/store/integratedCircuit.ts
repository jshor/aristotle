import { defineStore } from 'pinia'
import { v4 as uuid } from 'uuid'
import integratedCircuitFactory from '@/factories/integratedCircuitFactory'
import FileService from '@/services/FileService'
import idMapper from '@/utils/idMapper'
import Port from '@/types/interfaces/Port'
import SerializableState from '@/types/interfaces/SerializableState'
import ItemFactory from '@/types/types/ItemFactory'
import Item from '@/types/interfaces/Item'
import Direction from '@/types/enums/Direction'
import dFlipFlop from '@/containers/fixtures/d-flipflop.json'
import tFlipFlop from '@/containers/fixtures/t-flipflop.json'
import customCircuitFactory from '@/factories/customCircuitFactory'

type IntegratedCircuitState = {
  isBuilderOpen: boolean
  model: Item | null
  factories: {
    [id: string]: ItemFactory
  }
  resolve: () => void
}

export const useIntegratedCircuitStore = defineStore('integratedCircuit', {
  state: (): IntegratedCircuitState => ({
    isBuilderOpen: false,
    model: null,
    factories: {},
    resolve: () => {}
  }),

  actions: {
    loadAllToolbox () {
      this.factories[dFlipFlop.defaultName] = customCircuitFactory.bind(null, dFlipFlop as any)
      this.factories[tFlipFlop.defaultName] = customCircuitFactory.bind(null, tFlipFlop as any)
    },

    async launchBuilder (circuit: SerializableState) {
      this.isBuilderOpen = true

      const { item } = integratedCircuitFactory(circuit, 'My integrated circuit')

      this.model = item
    },

    async loadLibrary () {
      const filePaths = window.api.getFilePaths(window.api.getDefaultSavePath(), 'aicx')

      for (let i = 0; i < filePaths.length; i++) {
        await this.loadCircuit(filePaths[i])
      }
    },

    async loadCircuit (filePath: string) {
      try {
        const content = await FileService.open(filePath)
        const parsed = JSON.parse(content) as Item

        this.factories[parsed.defaultName] = () => {
          const item = idMapper.mapIntegratedCircuitIds(parsed)
          const ports = item
            .portIds
            .reduce((map, portId) => {
              const port = item.integratedCircuit?.ports[portId]

              if (port) {
                map[port.orientation].push(port)
              }

              return map
            }, {
              [Direction.Left]: [],
              [Direction.Top]: [],
              [Direction.Right]: [],
              [Direction.Bottom]: [],
            } as Record<Direction, Port[]>)

          return { item, ports }
        }
      } catch (error) {
        console.log(error)
        window.api.showMessageBox({
          message: `Could not load ${filePath} into the integrated circuit library. The file is not a valid Aristotle circuit.`,
          title: 'Error',
          type: 'error'
        })
      }
    },

    async save () {
      if (!this.model) return

      try {
        const fileName = `${this.model.defaultName}.aicx`
        const filePath = window.api.showSaveFileDialog([
          {
            name: 'Aristotle Integrated Circuit (*.aicx)',
            extensions: ['aicx']
          }
        ], fileName)

        if (!filePath) return

        await FileService.save(filePath, this.model)
        await this.loadCircuit(filePath)

        window.api.showMessageBox({
          message: 'Integrated circuit successfully created. You can find it in the toolbox.',
          title: 'Success',
          type: 'info'
        })
      } catch (error) {
        window.api.showMessageBox({
          message: 'An error occurred while trying to save the integrated circuit.',
          title: 'Error',
          type: 'error'
        })
      }

      this.close()
    },

    close () {
      this.resolve()
      this.isBuilderOpen = true
    }
  }
})
