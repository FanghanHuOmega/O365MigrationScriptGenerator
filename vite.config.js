import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      // Use the version of Vue that includes the browser compiler
      'vue': 'vue/dist/vue.esm-bundler.js'
    }
  }
})
