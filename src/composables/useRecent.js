import { ref, computed } from 'vue'
import { loadJSON, saveJSON, syncOnStorage } from '../utils/storage.js'
import { useSettings } from './useSettings'

// 最近查看：全局单例，最多保留条数由设置中心（cb.settings.recentLimit）决定，
// 默认 20；同一条目被再次打开时移到最前。
const KEY = 'cb.recent.v2'
const recent = ref(loadJSON(KEY, []))

// 其它标签页修改最近查看时，本页自动刷新
syncOnStorage(KEY, [], (v) => { recent.value = v })

function itemKey(moduleId, type, name) {
  return `${moduleId}|${type}|${name}`
}

export function useRecent() {
  const { recentLimit } = useSettings()

  const recentList = computed(() => recent.value)

  function record(moduleId, type, item) {
    const key = itemKey(moduleId, type, item.name)
    recent.value = recent.value.filter((r) => r.key !== key)
    recent.value.unshift({
      key,
      moduleId,
      type,
      name: item.name,
      item: { ...item, _type: type, _module: moduleId },
    })
    if (recent.value.length > recentLimit.value) recent.value.length = recentLimit.value
    saveJSON(KEY, recent.value)
  }

  function clear() {
    recent.value = []
    saveJSON(KEY, recent.value)
  }

  return { recentList, record, clear }
}