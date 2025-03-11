export default class PromiseUtil {
  static async waitLoading<T>(p: () => Promise<T>, finallyFn?: (data: T | undefined) => void, minLoadingTime = 500) {
    const startTime = Date.now()
    let data: T | undefined = undefined
    try {
      data = await p()
      return data
    } finally {
      // 保证最低 minLoadingTime 毫秒
      const duration = Date.now() - startTime
      if (duration < minLoadingTime) {
        await new Promise((resolve) => setTimeout(resolve, minLoadingTime - duration))
      }
      if (finallyFn) {
        finallyFn(data)
      }
    }
  }
}
