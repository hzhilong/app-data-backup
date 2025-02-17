import { defineConfig } from 'vite'
import electron from 'vite-electron-plugin'
import baseConfig from './vite.base.config'

export default defineConfig(({ mode }) => {
  const config = Object.assign({}, baseConfig({ mode }))
  config.plugins.push(
    electron({
      include: ['electron'],
      // 此处指向electron主进程文件
      entry: 'electron/index.ts',
    }),
  )
  return config
})
