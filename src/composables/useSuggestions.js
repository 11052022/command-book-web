import { computed } from 'vue'

/**
 * 搜索建议：输入时实时弹出标签/命令名自动补全（最多 8 条）。
 * @param {import('vue').Ref<string>} searchInput
 * @param {{ commands: import('vue').ComputedRef }} source 数据源（用于当前视图的标签/命令名）
 */
export function useSuggestions(searchInput, source) {
  const allTags = computed(() =>
    [...new Set((source.commands.value || []).flatMap((c) => c.tags || []))].sort()
  )
  const allCommandNames = computed(() =>
    (source.commands.value || []).map((c) => c.name)
  )

  const suggestions = computed(() => {
    const input = (searchInput.value || '').trim()
    if (!input) return []

    const lowerInput = input.toLowerCase()
    const results = []

    // 标签建议：startWith 优先、短的优先
    const matchingTags = allTags.value
      .filter((tag) => tag.includes(input) && tag !== input)
      .sort((a, b) => {
        const aStarts = a.startsWith(input) ? 0 : 1
        const bStarts = b.startsWith(input) ? 0 : 1
        if (aStarts !== bStarts) return aStarts - bStarts
        return a.length - b.length
      })
    for (const tag of matchingTags) {
      if (results.length >= 6) break
      results.push({ type: 'tag', label: tag, text: tag })
    }

    // 命令名建议（输入含英文时）
    if (/[a-zA-Z]/.test(input)) {
      const matchingNames = allCommandNames.value
        .filter((name) => name.toLowerCase().includes(lowerInput) && name.toLowerCase() !== lowerInput)
        .sort((a, b) => a.length - b.length)
      for (const name of matchingNames) {
        if (results.length >= 8) break
        if (!results.some((r) => r.text === name)) {
          results.push({ type: 'command', label: name, text: name })
        }
      }
    }

    return results
  })

  return { suggestions }
}