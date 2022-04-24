import JSZip from 'jszip'

export default class FileService {
  static async open (filePath: string) {
    if (!window.require) return

    const fs = window.require('fs')
    const zip = new JSZip()

    const compressedContent = fs.readFileSync(filePath)
    const { files } = await zip.loadAsync(compressedContent)
    const data = await files.content.async('text')

    return data
  }

  static async save (filePath: string, content: object) {
    if (!window.require) return

    const fs = window.require('fs')
    const zip = new JSZip()

    zip.file('content', JSON.stringify(content))

    const compressedContent = await zip.generateAsync({ type: 'blob' })
    const blob = Buffer.from(await compressedContent.arrayBuffer())

    fs.writeFileSync(filePath, blob)
  }
}
