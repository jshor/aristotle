import { createI18n } from "vue-i18n";

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    'en': {
      appName: 'Aristotle',
      command: {
        newDocument: 'New Circuit',
        selectDocument: 'Load Circuit',
        importDocument: 'Import Integrated Circuit',
        exportImage: 'Export Image',
        experience: 'Experience',
        simulation: 'Simulation',
        snapping: 'Snapping',
        grid: 'Grid'
      },
      fileTypes: {
        default: 'Aristotle Logic Circuit',
        integratedCircuit: 'Aristotle Integrated Circuit',
      },
      title: {
        oscilloscope: 'Oscilloscope',
        properties: 'Properties',
      },
      label: {
        connection: 'Connection',
        connectionFrom: 'Connection from {0} to {1}',
        renderingImage: 'Rendering image...',
        printing: 'Printing...',
        ready: 'Ready'
      },
      button: {
        openProperties: 'Open properties',
        clearOscilloscope: 'Clear oscilloscope',
        removeOscilloscope: 'Remove all observations',
        close: 'Close',
        fullscreen: 'Toggle fullscreen',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out'
      },
      toolbox: {
        InputNode: 'Inputs',
        OutputNode: 'Outputs',
        LogicGate: 'Logic Gates',
        IntegratedCircuit: 'Custom Circuits'
      },
      itemType: {
        InputNode: 'Input',
        OutputNode: 'Output',
        Clock: 'Clock',
        And: 'AND',
        Or: 'OR',
        Nand: 'NAND',
        Nor: 'NOR',
        Xnor: 'XNOR',
        Xor: 'XOR',
        Not: 'NOT',
        Buffer: 'Buffer',
        Tristate: 'Tri-state Buffer',
        Lightbulb: 'LED',
        DigitDisplay: '4-Bit Digit',
        Switch: 'Switch'
      },
      portType: {
        input: 'Input Port',
        output: 'Output Port'
      },
      propertyName: {
        name: 'Name',
        interval: 'Interval',
        startValue: 'Start value',
        inputCount: 'Input count'
      },
      propertyOption: {
        true: 'True',
        hiz: 'Hi-Z',
        false: 'False'
      },
      menu: {
        edit: {
          parent: '&Edit',
          undo: '&Undo',
          delete: 'Delete',
          selectAll: '&Select All',
          rotate: {
            parent: '&Rotate',
            clockwise: 'Rotate 90° &CW',
            counterClockwise: 'Rotate 90° CC&W'
          },
          forward: {
            parent: '&Bring Forward',
            bringForward: 'Bring &Forward',
            bringToFront: 'Bring to F&ront',
          },
          backward: {
            parent: '&Send Backward',
            sendBackward: 'Send &Backward',
            sendToBack: 'Send to Bac&k'
          },
          group: {
            parent: 'G&roup',
            group: '&Group',
            ungroup: '&Ungroup'
          },
          showInOscilloscope: 'Show in &Oscilloscope',
        },
        file: {
          parent: '&File',
          newCircuit: '&New Circuit',
          openCircuit: '&Open Circuit',
          openIntegratedCircuit: 'Open &Integrated Circuit',
          save: '&Save',
          saveAs: 'Save &As...',
          saveAll: 'Save &All',
          print: '&Print',
          export: {
            parent: 'E&xport',
            integratedCircuit: 'Integrated Circuit',
            pngImage: 'PNG Image'
          },
          switchTo: {
            parent: 'Switch to...',
            previous: 'Previous File',
            next: 'Next File'
          },
          closeDocument: 'Close Document',
          preferences: 'Preferences',
          closePreferences: 'Close Preferences',
          exit: 'E&xit'
        },
        oscilloscope: {
          clearAllWaves: 'Clear all waves',
          removeAllWaves: 'Remove all waves',
          close: 'Close oscilloscope'
        },
        view: {
          parent: '&View',
          zoomIn: '&Zoom In',
          zoomOut: '&Zoom Out',
          zoomLevel: '&Zoom...',
          zoomCustom: 'Custom',
          panToCenter: '&Pan to Center',
          fullscreen: '&Fullscreen'
        },
        grid: {
          parent: '&Grid',
          showGrid: '&Show grid',
          snapToGrid: 'Snap to &grid',
          snapToElements: 'Snap to &elements'
        },
        help: {
          parent: '&Help'
        }
      }
    }
  }
})

export function t (key: string) {
  return i18n.global.t(key).toString()
}
