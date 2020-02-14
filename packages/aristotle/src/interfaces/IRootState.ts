export default interface IRootState {
  activeDocumentId: string
  relayedCommand: any,
  documents: any[],
  dialog: {
    open: boolean,
    type: string,
    data: any
  }
}
