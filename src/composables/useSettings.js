import { ref, computed } from 'vue'
import { loadJSON, saveJSON, syncOnStorage } from '../utils/storage.js'

// 应用设置：全局单例，持久化到 localStorage（cb.settings）。
// 目前唯一的设置项是「最近查看保留条数」（recentLimit）。
const KEY = 'cb.settings'

export const RECENT_LIMIT_OPTIONS = [10, 20, 50]

const defaults = () => ({ recentLimit: 20 })

const initial = loadJSON(KEY, null) || {}
if (!RECENT_LIMIT_OPTIONS.includes(initial.recentLimit)) initial.recentLimit = defaults().recentLimit
const settings = ref({ ...defaults(), ...initial })

// 其它标签页改设置时，本页自动刷新（并复用条数合法性兜底）
syncOnStorage(KEY, defaults(), (saved) => {
  const merged = { ...defaults(), ...(saved || {}) }
  if (!RECENT_LIMIT_OPTIONS.includes(merged.recentLimit)) merged.recentLimit = defaults().recentLimit
  settings.value = merged
})

function persist() {
  saveJSON(KEY, settings.value)
}

export function useSettings() {
  function setRecentLimit(value) {
    if (!RECENT_LIMIT_OPTIONS.includes(value)) return
    settings.value = { ...settings.value, recentLimit: value }
    persist()
  }

  return {
    recentLimit: computed(() => settings.value.recentLimit),
    setRecentLimit,
  }
}