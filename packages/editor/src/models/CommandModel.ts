export default class CommandModel {
  public command: string
  public payload: any

  constructor (command: string, payload?: any) {
    this.command = command
    this.payload = payload
  }
}
