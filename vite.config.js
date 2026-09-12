import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 在线轻快版：常规多文件构建 + 按需拆包（shiki 较大，独立 chunk 懒加载）
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          shiki: ['shiki'],
          naive: ['naive-ui'],
          vendor: ['vue', 'vue-router'],
        },
      },
    },
  },
})