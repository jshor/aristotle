global.console = {
  ...console,
  // uncomment to ignore a specific log level
  // log: vi.fn(),
  // debug: vi.fn(),
  // info: vi.fn(),
  warn: vi.fn(),
  // error: vi.fn()
}

global.navigator.vibrate = vi.fn() as typeof navigator.vibrate

global.window.api = {
  showContextMenu: vi.fn(),
  setApplicationMenu: vi.fn(),
  showOpenFileDialog: vi.fn(() => []),
  showSaveFileDialog: vi.fn(() => ''),
  showMessageBox: vi.fn(() => 0),
  beep: vi.fn(),
  quit: vi.fn(),
  onBeforeClose: vi.fn(),
  onOpenFile: vi.fn(),
  openFile: vi.fn(() => ''),
  saveFile: vi.fn(),
  setFullscreen: vi.fn(),
  getFilePaths: vi.fn(() => []),
  getDefaultSavePath: vi.fn(() => ''),
  setClipboardContents: vi.fn(),
  getClipboardContents: vi.fn(() => ''),
  canPaste: vi.fn(() => true),
  clearClipboard: vi.fn()
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
