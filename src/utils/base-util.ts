import { CommonError } from '@/models/CommonError.ts'
export default class BaseUtil {
  public static isCommonError(error: unknown): error is CommonError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as Record<string, unknown>).message === 'string'
    )
  }

  public static getErrorMessage(error: unknown): string {
    return this.convertToCommonError(error).message
  }

  public static prependErrorMessage(error: CommonError, preMsg?: string): CommonError {
    if (preMsg) {
      error.message = `${preMsg}${error.message}`
    }
    return error
  }

  public static convertToCommonError(error: unknown, preMsg?: string): CommonError {
    if (this.isCommonError(error)) {
      return this.prependErrorMessage(error, preMsg)
    }
    try {
      return this.prependErrorMessage(new CommonError(JSON.stringify(error)), preMsg)
    } catch (error) {
      // 如果抛出的异常不是object
      return this.prependErrorMessage(new CommonError(String(error)), preMsg)
    }
  }
}
