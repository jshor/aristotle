import PropertySet from '@/types/interfaces/PropertySet'
import { defineStore } from 'pinia'

export const usePreferencesStore = defineStore({
  id: 'preferences',
  state: () => ({
    colors: {
      onColor: {
        type: 'color',
        label: 'High state',
        value: '#4bc567',
        description: 'When a signal is present.'
      },
      offColor: {
        type: 'color',
        label: 'Low state',
        value: '#c0c0c0',
        description: 'When no signal is present.'
      },
      unknownColor: {
        type: 'color',
        label: 'Unknown state',
        value: '#ff0000',
        description: 'High impedance (Hi-Z).'
      }
    } as PropertySet,
    snapping: {
      snapToGrid: {
        type: 'boolean',
        label: 'Snap to grid',
        value: false,
        description: 'Snap elements to the grid lines.',
        excludes: ['snapToAlign']
      },
      snapToAlign: {
        type: 'boolean',
        label: 'Snap to align',
        value: true,
        description: 'Snap elements together.',
        excludes: ['snapToGrid']
      },
      snapTolerance: {
        type: 'number',
        label: 'Snap tolerance',
        value: 15,
        description: 'Maximum distance from a dragging object to snap to another element.'
      }
    } as PropertySet,
    grid: {
      showGrid: {
        type: 'boolean',
        label: 'Show grid',
        value: true,
        description: 'Display a grid on the canvas.'
      },
      gridSize: {
        type: 'number',
        label: 'Grid size',
        value: 20,
        description: 'Distance between grid lines.',
        excludes: ['snapToAlign']
      }
    } as PropertySet,
    simulation: {
      startPaused: {
        type: 'boolean',
        label: 'Pause on startup',
        value: true,
        description: 'Start simulation paused.'
      }
    } as PropertySet,
    experience: {
      vibration: {
        type: 'boolean',
        label: 'Vibration',
        value: true,
        description: 'Haptic feedback on gestures.',
        mobileOnly: true
      },
      autosave: {
        type: 'boolean',
        label: 'Auto-save',
        value: true,
        description: 'Automatically save your work.',
        desktopOnly: true
      },
      darkMode: {
        type: 'boolean',
        label: 'Dark mode',
        value: true
      }
    } as PropertySet
  }),

  actions: {
    async writeSettings () {
      try {
        // TODO: determine settings path for each OS
        // await FileService.open('?')
      } catch (_) {}
    },

    async updateSettings (preferences: PropertySet) {
      await this.writeSettings()
    }
  }
})
