import { Command } from '../types'

export default interface ICommand {
  type: any // Command | string // TODO
  payload: any
  documentId?: string
}
