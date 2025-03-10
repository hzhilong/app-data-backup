import BaseUtil from '@/utils/base-util.ts'

/**
 * 业务执行结果
 */
export class BuResult<T> {
  success: boolean
  msg: string
  data?: T

  constructor(success: boolean, msg: string, data?: T) {
    this.success = success
    this.msg = msg
    this.data = data
  }

  static createSuccess<T>(data: T) {
    return new BuResult(true, '操作成功', data)
  }

  static createFail<T>(msg: string = '操作失败', data?: T) {
    return new BuResult(false, msg, data)
  }

  static createError<T>(e: unknown) {
    return new BuResult<T>(false, BaseUtil.getErrorMessage(e))
  }

  /**
   * 展开成Promise
   */
  static getPromise<T>(result: BuResult<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (result.success) {
        resolve(result.data as T)
      } else {
        reject(result.msg)
      }
    })
  }
}

/**
 * 执行业务（自动包裹BuResult）
 * @param run 执行方法
 */
export const execBusiness = async <T>(run: () => Promise<T>): Promise<BuResult<T>> => {
  try {
    return BuResult.createSuccess<T>(await run())
  } catch (e) {
    return BuResult.createError(e)
  }
}
