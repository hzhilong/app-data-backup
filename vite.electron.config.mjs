import { defineConfig } from 'vite'
import electron from 'vite-electron-plugin'
import baseConfig from './vite.base.config.mjs'

export default defineConfig(({ mode }) => {
  let config = Object.assign({}, baseConfig({ mode }))
  config.plugins.push(
    electron({
      include: ['electron'],
      // 此处指向electron主进程文件
      entry: 'electron/index.js',
    }),
  )
  return config
})
