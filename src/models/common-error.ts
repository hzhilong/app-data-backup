export class CommonError {
  message: string

  constructor(message: string) {
    this.message = message
  }
}

export class AbortedError extends CommonError {

  constructor() {
    super('操作已取消')
  }

}
