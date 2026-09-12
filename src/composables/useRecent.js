import { ref, computed } from 'vue'
import { loadJSON, saveJSON } from '../utils/storage.js'

// 最近查看：全局单例，最多保留 20 条，同一条目被再次打开时移到最前。
const KEY = 'cb.recent.v2'
const MAX = 20
const recent = ref(loadJSON(KEY, []))

function itemKey(moduleId, type, name) {
  return `${moduleId}|${type}|${name}`
}

export function useRecent() {
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
    if (recent.value.length > MAX) recent.value.length = MAX
    saveJSON(KEY, recent.value)
  }

  return { recentList, record }
}