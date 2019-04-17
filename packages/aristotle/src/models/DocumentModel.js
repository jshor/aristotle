// import uuid from '@/utils/uuid'
import { EditorModel } from '@aristotle/editor'

class DocumentModel {
  constructor () {
    this.id = 'random-id' // uuid()
    this.editorModel = new EditorModel({})
  }
}

export default DocumentModel
