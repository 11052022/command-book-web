import { ref, computed } from 'vue'
import { loadJSON, saveJSON } from '../utils/storage.js'

// 收藏：全局单例状态（跨模块），持久化到 localStorage。
// 条目结构：{ key, moduleId, name, type: 'command' | 'recipe', item }
const KEY = 'cb.favorites.v2'
const favorites = ref(loadJSON(KEY, []))

function itemKey(moduleId, type, name) {
  return `${moduleId}|${type}|${name}`
}

export function useFavorites() {
  const favoritesList = computed(() => favorites.value)

  function isFav(moduleId, type, name) {
    return favorites.value.some((f) => f.key === itemKey(moduleId, type, name))
  }

  function toggle(moduleId, type, item) {
    const key = itemKey(moduleId, type, item.name)
    const idx = favorites.value.findIndex((f) => f.key === key)
    if (idx >= 0) {
      favorites.value.splice(idx, 1)
    } else {
      favorites.value.push({
        key,
        moduleId,
        type,
        name: item.name,
        item: { ...item, _type: type, _module: moduleId },
      })
    }
    saveJSON(KEY, favorites.value)
  }

  return { favoritesList, isFav, toggle }
}