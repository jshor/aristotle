declare global {
  interface ClipboardData extends SerializableState {
    pasteCount: number
  }
}

export default ClipboardData
