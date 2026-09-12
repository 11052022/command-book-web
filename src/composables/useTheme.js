import { ref, computed } from 'vue'
import { darkTheme, lightTheme } from 'naive-ui'
import { loadJSON, saveJSON, syncOnStorage } from '../utils/storage.js'

// 主题：默认暗色，偏好持久化
const THEME_KEY = 'cb.theme'
const isDark = ref(loadJSON(THEME_KEY, true))

// 其它标签页改主题时，本页自动跟随
syncOnStorage(THEME_KEY, true, (v) => { isDark.value = v })

export function useTheme() {
  const naiveTheme = computed(() => (isDark.value ? darkTheme : lightTheme))

  function toggleTheme() {
    isDark.value = !isDark.value
    saveJSON(THEME_KEY, isDark.value)
  }

  return { isDark, naiveTheme, toggleTheme }
}