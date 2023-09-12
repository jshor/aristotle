global.console = {
  ...console,
  // uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  // error: jest.fn()
}

global.navigator.vibrate = jest.fn()

global.window.api = {
  showContextMenu: jest.fn(),
  setApplicationMenu: jest.fn(),
  showOpenFileDialog: jest.fn(() => []),
  showSaveFileDialog: jest.fn(() => ''),
  showMessageBox: jest.fn(() => 0),
  beep: jest.fn(),
  quit: jest.fn(),
  onBeforeClose: jest.fn(),
  onOpenFile: jest.fn(),
  openFile: jest.fn(() => ''),
  saveFile: jest.fn(),
  setFullscreen: jest.fn(),
  getFilePaths: jest.fn(() => []),
  getDefaultSavePath: jest.fn(() => ''),
  setClipboardContents: jest.fn(),
  getClipboardContents: jest.fn(() => ''),
  canPaste: jest.fn(() => true),
  clearClipboard: jest.fn()
}

global.DOMRect = class DOMRect {
  bottom: number = 0
  left: number = 0
  right: number = 0
  top: number = 0

  constructor (public x = 0, public y = 0, public width = 0, public height = 0) {}

  static fromRect (other?: DOMRectInit): DOMRect {
    return new DOMRect(other?.x, other?.y, other?.width, other?.height)
  }

  toJSON () {
    return JSON.stringify(this)
  }
}
