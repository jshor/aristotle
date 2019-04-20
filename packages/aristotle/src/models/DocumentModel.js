// import uuid from '@/utils/uuid'
import { EditorModel } from '@aristotle/editor'

class DocumentModel {
  constructor () {
    this.id = 'X' + (Math.random() * 1000).toString().replace('.', '').substring(0, 5)
    this.editorModel = new EditorModel({})
  }
}

export default DocumentModel
