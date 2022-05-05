import JSZip from 'jszip'

export default class FileService {
  static async open (filePath: string) {
    const zip = new JSZip()

    const compressedContent = window.api.openFile(filePath)
    const { files } = await zip.loadAsync(compressedContent)
    const data = await files.content.async('text')

    return data
  }

  static async save (filePath: string, content: object) {
    const zip = new JSZip()

    zip.file('content', JSON.stringify(content))

    const compressedContent = await zip.generateAsync({ type: 'blob' })
    const blob = Buffer.from(await compressedContent.arrayBuffer())

    window.api.saveFile(filePath, blob)
  }
}
