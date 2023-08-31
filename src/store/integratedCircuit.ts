import { defineStore } from 'pinia'
import { v4 as uuid } from 'uuid'
import integratedCircuitFactory from '@/factories/integratedCircuitFactory'
import FileService from '@/services/FileService'
import idMapper from '@/utils/idMapper'

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

    launchBuilder (circuit: SerializableState) {
      this.isBuilderOpen = true
      this.model = integratedCircuitFactory(circuit, 'My integrated circuit', 400, 400)

      return new Promise(resolve => {
        this.resolve = resolve as () => void
      })
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

        this.factories[parsed.name] = () => {
          const item = idMapper.mapIntegratedCircuitIds(parsed)
          const ports = item
            .portIds
            .map(portId => item.integratedCircuit?.ports[portId] as Port)

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
        const fileName = `${this.model.name}.aicx`
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
