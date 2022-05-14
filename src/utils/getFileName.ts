export default function getFileName (filePath: string) {
  return filePath.split('\\').pop()?.split('/').pop() || ''
}
