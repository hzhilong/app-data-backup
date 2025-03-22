export type LogLevel = 'all' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off'

export interface AppLog {
  level: LogLevel
  contents: unknown[]
}
