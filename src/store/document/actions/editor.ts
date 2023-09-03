import { DocumentStoreInstance } from '..'

export function loadDocument (this: DocumentStoreInstance, document: string) {
  const parsed = JSON.parse(document)

  if (parsed.integratedCircuit) {
    this.applyDeserializedState(parsed.integratedCircuit)
  } else {
    this.applySerializedState(document)
  }

  this.initialize()
}

export function initialize (this: DocumentStoreInstance) {
  this.resetCircuit()
  this.oscillator.onTick = (o: Oscillogram) => this.oscillogram = o
}

export function print (this: DocumentStoreInstance) {
  this.isPrinting = true
}

export function createImage (this: DocumentStoreInstance) {
  this.isCreatingImage = true
}
