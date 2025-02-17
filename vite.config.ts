import { defineConfig } from 'vite'
import baseConfig from './vite.base.config'

export default defineConfig(({mode})=>{
  return baseConfig({mode})
})
