import JSZip from 'jszip'

export default class FileService {
  static async open (filePath: string) {
    const zip = new JSZip()

    const compressedContent = window.api.openFile(filePath)
    const { files } = await zip.loadAsync(compressedContent)
    const data = await files.content.async('text')

    console.log('DATA: ', data)

    return data
  }

  static async writeBlob (filePath: string, blob: Blob) {
    const blobby = await blob.arrayBuffer()

    window.api.saveFile(filePath, blobby)
  }

  static async save (filePath: string, content: object) {
    // TODO: handle rapid-succession saves (in a queue?)
    const zip = new JSZip()

    zip.file('content', JSON.stringify(content))

    const compressedContent = await zip.generateAsync({ type: 'blob' })

    this.writeBlob(filePath, compressedContent)
  }
}
