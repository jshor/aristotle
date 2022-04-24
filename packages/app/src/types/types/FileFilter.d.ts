declare global {
  type FileFilter = {
    name: string,
    extensions: string[]
  }
}

export default FileFilter
