import Oscillogram from '@/types/types/Oscillogram'
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

export function setHasLoaded (this: DocumentStoreInstance) {
  this.hasLoaded = true

  if (!this.loadPromise) {
    this.load()
  }

  this.loadResolver!()
}

export async function load (this: DocumentStoreInstance) {
  if (!this.loadPromise) {
    this.loadPromise = new Promise<void>(resolve => {
      this.loadResolver = resolve
    })
  }

  await this.loadPromise
  await new Promise(resolve => setTimeout(resolve, 0))
}
