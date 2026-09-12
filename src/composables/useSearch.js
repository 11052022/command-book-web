import { ref, computed } from 'vue'

// ---- helpers (pure) ----

function addToIndex(idx, type, name, tags) {
  tags.forEach((tag) => {
    if (!idx.has(tag)) idx.set(tag, new Map())
    const inner = idx.get(tag)
    if (!inner.has(type)) inner.set(type, new Set())
    inner.get(type).add(name)
  })
}

/**
 * Score a single item against keywords（AND 逻辑）。
 * 权重：名称精确 300 / 标签 100 / 名称包含 30 / 语法 15 / 描述 10 / 示例 5
 */
function scoreItem(item, keywords, tagIndex) {
  let totalScore = 0
  for (const kw of keywords) {
    const lowerKw = kw.toLowerCase()
    let kwMatched = false

    // 标签匹配
    const matchingTags = [...tagIndex.keys()].filter((tag) => tag.includes(kw))
    for (const tag of matchingTags) {
      const inner = tagIndex.get(tag)
      if (!inner) continue
      for (const names of inner.values()) {
        if (names.has(item.name)) {
          totalScore += 100
          kwMatched = true
        }
      }
    }

    if (item.name === lowerKw) {
      totalScore += 300
      kwMatched = true
    } else if (item.name.toLowerCase().includes(lowerKw)) {
      totalScore += 30
      kwMatched = true
    }

    if (item.synopsis && item.synopsis.toLowerCase().includes(lowerKw)) {
      totalScore += 15
      kwMatched = true
    }

    if (item.description && item.description.toLowerCase().includes(lowerKw)) {
      totalScore += 10
      kwMatched = true
    }

    if (item.examples) {
      for (const ex of item.examples) {
        if ((ex.description || '').includes(kw) || (ex.code || '').toLowerCase().includes(lowerKw)) {
          totalScore += 5
          kwMatched = true
          break
        }
      }
    }

    if (!kwMatched) return null
  }
  return totalScore
}

// ---- shared reactive state（页面级，路由切换时经 reset 清理） ----
const searchInput = ref('')
const activeCategory = ref(null)
const expandedCommand = ref(null)
const typeFilter = ref('all') // 'all' | 'command' | 'recipe'

const TYPE_TRIGGERS = {
  recipe: ['#recipe', '#配方'],
  command: ['#command', '#命令'],
}

function parseTypeTokens(input) {
  const lower = input.toLowerCase()
  for (const [type, triggers] of Object.entries(TYPE_TRIGGERS)) {
    for (const token of triggers) {
      if (lower.includes(token)) {
        const allTokens = Object.values(TYPE_TRIGGERS).flat()
        let cleaned = input
        for (const t of allTokens) {
          cleaned = cleaned.replace(new RegExp(t.replace('#', '\\s*#'), 'gi'), '')
        }
        return { cleanedInput: cleaned.trim(), detectedType: type }
      }
    }
  }
  return { cleanedInput: input, detectedType: 'all' }
}

/**
 * 搜索：数据源由调用方注入（模块命令列表 / 收藏 / 最近查看）。
 * @param {{ commands: import('vue').ComputedRef, recipes: import('vue').ComputedRef }} source
 */
export function useSearch(source) {
  const commands = source.commands
  const recipes = source.recipes

  const tagIndex = computed(() => {
    const idx = new Map()
    commands.value.forEach((c) => addToIndex(idx, 'command', c.name, c.tags || []))
    recipes.value.forEach((r) => addToIndex(idx, 'recipe', r.name, r.tags || []))
    return idx
  })

  const allTags = computed(() => [...tagIndex.value.keys()])

  const matchedCommands = computed(() => {
    const rawInput = searchInput.value.trim()
    const cmds = commands.value
    const rcp = recipes.value
    const idx = tagIndex.value

    const { cleanedInput, detectedType } = parseTypeTokens(rawInput)
    const effectiveTypeFilter = detectedType !== 'all' ? detectedType : typeFilter.value
    const input = cleanedInput

    let filteredCmds = cmds
    let filteredRecipes = rcp
    if (activeCategory.value) {
      filteredCmds = cmds.filter((c) => c.category === activeCategory.value)
      filteredRecipes = rcp.filter((r) => r.category === activeCategory.value)
    }

    if (effectiveTypeFilter === 'command') filteredRecipes = []
    if (effectiveTypeFilter === 'recipe') filteredCmds = []

    if (!input) return [...filteredCmds, ...filteredRecipes]

    const keywords = input.split(/\s+/).filter(Boolean)

    const cmdResults = []
    for (const cmd of filteredCmds) {
      const s = scoreItem(cmd, keywords, idx)
      if (s !== null) cmdResults.push({ ...cmd, _type: 'command', _score: s })
    }
    const recipeResults = []
    for (const r of filteredRecipes) {
      const s = scoreItem(r, keywords, idx)
      if (s !== null) recipeResults.push({ ...r, _type: 'recipe', _score: s })
    }

    if (cmdResults.length === 0 && recipeResults.length === 0) {
      // AND 无结果 → OR 兜底
      const orMatches = new Map()
      for (const kw of keywords) {
        const lowerKw = kw.toLowerCase()
        for (const cmd of filteredCmds) {
          if (
            cmd.name.toLowerCase().includes(lowerKw) ||
            (cmd.description || '').includes(kw) ||
            (cmd.synopsis || '').toLowerCase().includes(lowerKw) ||
            (cmd.tags || []).some((t) => t.includes(kw)) ||
            (cmd.examples || []).some(
              (ex) => (ex.description || '').includes(kw) || (ex.code || '').toLowerCase().includes(lowerKw)
            )
          ) {
            const bonus = cmd.name === lowerKw ? 100 : 0
            orMatches.set(cmd.name, (orMatches.get(cmd.name) || 0) + 1 + bonus)
          }
        }
      }
      const orResults = [...orMatches.entries()]
        .map(([name, count]) => {
          const cmd = filteredCmds.find((c) => c.name === name)
          return cmd ? { ...cmd, _type: 'command', _score: count } : null
        })
        .filter(Boolean)

      const orRcp = []
      for (const kw of keywords) {
        const lowerKw = kw.toLowerCase()
        for (const r of filteredRecipes) {
          if (
            (r.name || '').toLowerCase().includes(lowerKw) ||
            (r.description || '').includes(kw) ||
            (r.tags || []).some((t) => t.includes(kw))
          ) {
            const existing = orRcp.find((x) => x.name === r.name)
            if (existing) existing._score++
            else orRcp.push({ ...r, _type: 'recipe', _score: 1 })
          }
        }
      }

      return [...orResults, ...orRcp].sort(
        (a, b) => b._score - a._score || String(a.name).localeCompare(String(b.name))
      )
    }

    const merged = [...cmdResults, ...recipeResults]
    merged.sort((a, b) => b._score - a._score || String(a.name).localeCompare(String(b.name)))
    return merged
  })

  const matchedTags = computed(() => {
    const input = searchInput.value.trim()
    if (!input) return []
    return allTags.value.filter((tag) => input.includes(tag))
  })

  // 路由/视图切换时清空跨页面状态
  function reset() {
    searchInput.value = ''
    activeCategory.value = null
    expandedCommand.value = null
    typeFilter.value = 'all'
  }

  return { searchInput, activeCategory, typeFilter, expandedCommand, matchedCommands, matchedTags, reset }
}