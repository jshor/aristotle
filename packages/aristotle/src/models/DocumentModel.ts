import EditorModel from './EditorModel'
import uuid from '@/utils/uuid'

class DocumentModel {
  public id: string
  public editorModel: EditorModel = new EditorModel({})
  public data: String

  constructor () {
    this.id = uuid()
  }
}

export default DocumentModel
