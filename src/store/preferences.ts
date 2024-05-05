import Property from '@/types/interfaces/Property'
import { defineStore } from 'pinia'
import { useRootStore } from './root'

export const usePreferencesStore = defineStore({
  id: 'preferences',
  state: () => ({
    isOpen: false,
    colors: {
      onColor: {
        type: 'color',
        label: 'High state',
        value: '#4bc567',
        description: 'When a signal is present.'
      } as Property<string>,
      offColor: {
        type: 'color',
        label: 'Low state',
        value: '#c0c0c0',
        description: 'When no signal is present.'
      } as Property<string>,
      unknownColor: {
        type: 'color',
        label: 'Unknown state',
        value: '#ff0000',
        description: 'High impedance (Hi-Z).'
      } as Property<string>,
      animate: {
        type: 'boolean',
        label: 'Animate signal direction',
        value: true,
        description: 'Show animated dashes in the direction of the signal\'s electrical flow.'
      } as Property<boolean>
    },
    snapping: {
      snapToGrid: {
        type: 'boolean',
        label: 'Snap to grid',
        value: false,
        description: 'Snap elements to the grid lines.',
        excludes: ['snapToAlign']
      } as Property<boolean>,
      snapToAlign: {
        type: 'boolean',
        label: 'Snap to align',
        value: true,
        description: 'Snap elements together.',
        excludes: ['snapToGrid']
      } as Property<boolean>,
      /** The distance to the element to snap to. */
      snapTolerance: {
        type: 'number',
        label: 'Snap tolerance',
        /** The tolerance value. */
        value: 15,
        min: 1,
        max: 50,
        description: 'Maximum distance from a dragging object to snap to another element.'
      } as Property<number>
    },
    grid: {
      showGrid: {
        type: 'boolean',
        label: 'Show grid',
        value: true,
        description: 'Display a grid on the canvas.'
      } as Property<boolean>,
      /** The grid size to display. */
      gridSize: {
        type: 'number',
        label: 'Grid size',
        /** The width/height of each grid cell. */
        value: 20,
        min: 10,
        max: 50,
        description: 'Distance between grid lines.',
        excludes: ['snapToAlign']
      } as Property<number>
    },
    simulation: {
      startPaused: {
        type: 'boolean',
        label: 'Pause on startup',
        value: true,
        description: 'Start simulation paused.'
      } as Property<boolean>
    },
    experience: {
      vibration: {
        type: 'boolean',
        label: 'Vibration',
        value: true,
        description: 'Haptic feedback on gestures.',
        mobileOnly: true
      } as Property<boolean>,
      autosave: {
        type: 'boolean',
        label: 'Auto-save',
        value: true,
        description: 'Automatically save your work.',
        desktopOnly: true
      } as Property<boolean>,
      darkMode: {
        type: 'boolean',
        label: 'Dark mode',
        value: true
      } as Property<boolean>
    }
  }),

  getters: {
    /**
     * The CSS color variables.
     */
    colorStyles (state) {
      return {
        '--color-on': state.colors.onColor.value,
        '--color-off': state.colors.offColor.value,
        '--color-hi-z': state.colors.unknownColor.value
      }
    }
  },

  actions: {
    async savePreferences () {
      try {
        // TODO: determine settings path for each OS
        // await FileService.open('?')
      } catch (_) {}
    }
  }
})
