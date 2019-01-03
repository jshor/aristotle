import Command from '@/types/Command'

export default class CommandModel {
  public command: Command | undefined
  public payload: any
  public isExecuted: boolean = false

  constructor (command?: Command, payload?: any) {
    this.command = command
    this.payload = payload
  }
}
