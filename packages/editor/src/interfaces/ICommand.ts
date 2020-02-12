import { Command } from '../types'

export default interface ICommand {
  type: Command
  payload: any
  documentId?: string
}
