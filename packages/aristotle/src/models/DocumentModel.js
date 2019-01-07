import uuid from '@/utils/uuid'
import EditorModel from './EditorModel'

class DocumentModel {
  constructor () {
    this.id = uuid()
    this.editorModel = new EditorModel({})
  }
}

export default DocumentModel
