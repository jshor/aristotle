import SerializableState from './SerializableState'

interface ClipboardData extends SerializableState {
  pasteCount: number
}

export default ClipboardData
