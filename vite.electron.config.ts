import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import baseConfig from './vite.base.config'

export default defineConfig(({ mode }) => {
  const config = Object.assign({}, baseConfig({ mode }))
  config.plugins.push(
    electron({
      main: {
        // Shortcut of `build.lib.entry`
        entry: 'electron/main.ts',
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`
        input: 'electron/preload.ts',
      },

      // Optional: Use Node.js API in the Renderer process
      // renderer: {},
    }),
  )
  return config
})
