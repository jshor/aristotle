import { DocumentStoreInstance } from '..'

export function loadDocument (this: DocumentStoreInstance, document: string) {
  this.applyState(document)
  this.resetCircuit()
}

export function clearStatelessInfo (this: DocumentStoreInstance) {
  this.unsetConnectionPreview()
  this.connectablePortIds = []
  this.selectedConnectionIds = []
  this.selectedItemIds = []
  this.selectedPortIndex = -1
  this.cachedState = null
  this.activePortId = null
  this.connectionPreviewId = null
}

export function print (this: DocumentStoreInstance) {
  this.isPrinting = true
}

export function createImage (this: DocumentStoreInstance) {
  this.isCreatingImage = true
}

export function toggleToolbox (this: DocumentStoreInstance) {
  this.isToolboxOpen = !this.isToolboxOpen
}
