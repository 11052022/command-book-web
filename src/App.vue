<script setup>
import { provide, ref } from 'vue'
import { NConfigProvider, NMessageProvider, NGlobalStyle, NLayout } from 'naive-ui'
import { createDiscreteApi } from 'naive-ui'
import HeaderBar from './components/HeaderBar.vue'
import SettingsModal from './components/SettingsModal.vue'
import { useTheme } from './composables/useTheme'
import { loadJSON, saveJSON, syncOnStorage } from './utils/storage.js'

const { isDark, naiveTheme, toggleTheme } = useTheme()

// 复制等轻提示（卡片组件通过 inject('cb_message') 获取）
const { message } = createDiscreteApi(['message'])
provide('cb_message', message)

// 紧凑模式：全局开关，持久化
const compactMode = ref(loadJSON('cb.compact', false))
syncOnStorage('cb.compact', false, (v) => { compactMode.value = v })
function toggleCompact() {
  compactMode.value = !compactMode.value
  saveJSON('cb.compact', compactMode.value)
}
provide('compactMode', compactMode)

// 设置弹窗
const showSettings = ref(false)
</script>

<template>
  <NConfigProvider :theme="naiveTheme">
    <NMessageProvider>
      <NGlobalStyle />
      <NLayout class="app-layout">
        <HeaderBar
          :is-dark="isDark"
          :compact-mode="compactMode"
          @toggle-theme="toggleTheme"
          @toggle-compact="toggleCompact"
          @open-settings="showSettings = true"
        />
        <SettingsModal v-model:show="showSettings" />
        <router-view />
      </NLayout>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
}
</style>