import Oscillogram from '@/types/types/Oscillogram'
import { DocumentStoreInstance } from '..'
import { DocumentStatus } from '@/types/enums/DocumentStatus'

export function loadDocument (this: DocumentStoreInstance, document: string) {
  const parsed = JSON.parse(document)

  if (parsed.integratedCircuit) {
    this.applyDeserializedState(parsed.integratedCircuit)
  } else {
    this.applySerializedState(document)
  }

  this.initialize()
}

export function setStatus (this: DocumentStoreInstance, status: DocumentStatus) {
  this.status = status
}

export function initialize (this: DocumentStoreInstance) {
  this.resetCircuit()
  this.oscillator.onTick = (o: Oscillogram) => this.oscillogram = o
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
