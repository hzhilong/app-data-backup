import { CommonError } from '@/models/common-error'
import dayjs from 'dayjs'
import { nanoid } from 'nanoid'

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

  static getFormatedDateTime(date?: Date): string {
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
  }

  static getFormatedDate(date?: Date): string {
    return dayjs(date).format('YYYY-MM-DD')
  }

  static getFormatedTime(date?: Date): string {
    return dayjs(date).format('HH:mm:ss')
  }

  static generateId(): string {
    return nanoid()
  }
}

// 防抖函数
export function debounce(fn: (...args: any[]) => void, delay: number) {
  let timer: undefined | ReturnType<typeof setTimeout>
  return (...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
