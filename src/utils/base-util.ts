import { CommonError } from '@/models/CommonError'

export default class BaseUtil {
  static isCommonError(error: unknown): error is CommonError {
    return error instanceof CommonError
  }

  static getErrorMessage(error: unknown): string {
    return this.convertToCommonError(error).message
  }

  static prependErrorMessage(error: CommonError, preMsg?: string): CommonError {
    if (preMsg) {
      error.message = `${preMsg}${error.message}`
    }
    return error
  }

  static convertToCommonError(error: unknown, preMsg?: string): CommonError {
    if (this.isCommonError(error)) {
      return this.prependErrorMessage(error, preMsg)
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as Record<string, unknown>).message === 'string'
    ) {
      const newError = error as { message: string }
      return this.prependErrorMessage(new CommonError(newError.message), preMsg)
    } else {
      // 如果抛出的异常不是object
      return this.prependErrorMessage(new CommonError(String(error)), preMsg)
    }
  }
}
