import { defineConfig } from 'vite'
import baseConfig from './vite.base.config.mjs'

export default defineConfig(({mode})=>{
  return baseConfig({mode})
})
