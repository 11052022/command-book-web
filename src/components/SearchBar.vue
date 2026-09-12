<script setup>
import { ref, inject, onMounted, toRef, watch } from 'vue'
import { NInput, NTag } from 'naive-ui'

const props = defineProps({
  searchInput: { type: String, default: '' },
  suggestions: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:searchInput'])

// 由 Browser 注入：匹配列表 / 类型过滤读写（避免各自新建一份搜索状态）
const matchedCommands = inject('viewMatched', () => ({
  value: [],
}))
const typeFilter = inject('viewTypeFilter')
const setTypeFilter = inject('setTypeFilter', (v) => v)

const recipeCount = () => matchedCommands.value.filter((r) => r._type === 'recipe').length
const commandCount = () => matchedCommands.value.filter((r) => r._type !== 'recipe').length

const filterOptions = [
  { key: 'all', label: '全部' },
  { key: 'command', label: '命令' },
  { key: 'recipe', label: '配方' },
]

const inputRef = ref(null)
const focused = ref(false)
const highlightIndex = ref(-1)
const showSuggestions = ref(false)

const searchInputRef = toRef(props, 'searchInput')

watch([() => props.suggestions, focused], ([sugs, foc]) => {
  showSuggestions.value = foc && sugs.length > 0
})
watch([commandCount, recipeCount], () => {
  // 计数变化时刷新（响应式由注入的 ref 驱动）
})

function selectSuggestion(suggestion) {
  emit('update:searchInput', suggestion.text)
  highlightIndex.value = -1
  inputRef.value?.focus()
}

function onInputKeydown(e) {
  if (!showSuggestions.value) return
  let handled = false
  if (e.key === 'ArrowDown') {
    highlightIndex.value = Math.min(highlightIndex.value + 1, props.suggestions.length - 1)
    handled = true
  } else if (e.key === 'ArrowUp') {
    highlightIndex.value = Math.max(highlightIndex.value - 1, -1)
    handled = true
  } else if (e.key === 'Enter' && highlightIndex.value >= 0) {
    selectSuggestion(props.suggestions[highlightIndex.value])
    handled = true
  } else if (e.key === 'Escape') {
    highlightIndex.value = -1
    inputRef.value?.blur()
    handled = true
  }
  if (handled) {
    e.preventDefault()
    e.stopPropagation()
  }
}

onMounted(() => {
  inputRef.value?.focus()
})

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<template>
  <div class="search-bar" @keydown="onInputKeydown">
    <NInput
      ref="inputRef"
      :value="searchInput"
      placeholder="输入描述查找命令，空格分隔多关键词...（如：删除 文件夹、压缩 解压、磁盘 空间）"
      size="large"
      clearable
      round
      @update:value="(v) => emit('update:searchInput', v)"
      @focus="focused = true"
      @blur="focused = false"
    >
      <template #prefix><span class="search-icon">🔍</span></template>
      <template #suffix><span class="shortcut-hint">/</span></template>
    </NInput>

    <div class="filter-row">
      <NTag
        v-for="opt in filterOptions"
        :key="opt.key"
        :type="typeFilter === opt.key ? 'primary' : 'default'"
        size="small"
        :bordered="false"
        class="filter-chip"
        :class="{ 'filter-chip--active': typeFilter === opt.key }"
        @click="setTypeFilter(opt.key)"
      >
        {{ opt.label }}
        <template v-if="opt.key === 'command' && commandCount() > 0">· {{ commandCount() }}</template>
        <template v-if="opt.key === 'recipe' && recipeCount() > 0">· {{ recipeCount() }}</template>
      </NTag>
      <span class="filter-hint">或输入 #recipe / #命令 快捷切换</span>
    </div>

    <div v-if="showSuggestions" class="suggestions-panel">
      <div
        v-for="(s, i) in suggestions"
        :key="s.text"
        class="suggestion-item"
        :class="{ 'suggestion-item--active': i === highlightIndex }"
        @mousedown.prevent="selectSuggestion(s)"
        @mouseenter="highlightIndex = i"
      >
        <span class="suggestion-icon">{{ s.type === 'command' ? '⌨' : '🏷' }}</span>
        <span class="suggestion-text">{{ s.text }}</span>
        <span class="suggestion-type">{{ s.type === 'command' ? '命令' : '标签' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-bar { margin-bottom: 16px; position: relative; }
.filter-row { display: flex; align-items: center; gap: 6px; margin-top: 10px; padding: 0 4px; }
.filter-chip { cursor: pointer; transition: all 0.12s; user-select: none; font-weight: 500; }
.filter-chip:hover { transform: translateY(-1px); }
.filter-chip--active { box-shadow: 0 2px 8px rgba(var(--n-primary-color-rgb, 99 144 255), 0.25); }
.filter-hint { font-size: 11px; opacity: 0.3; margin-left: 8px; user-select: none; }
.search-icon { font-size: 16px; }
.shortcut-hint {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 4px; font-size: 11px;
  font-weight: 600; opacity: 0.4; border: 1px solid currentColor;
}
.suggestions-panel {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 800;
  background: var(--n-color); border: 1px solid var(--n-border-color);
  border-radius: 12px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
  padding: 6px; max-height: 320px; overflow-y: auto;
}
.suggestion-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 14px; border-radius: 8px; cursor: pointer; transition: background 0.1s;
}
.suggestion-item:hover, .suggestion-item--active { background: var(--n-primary-color-suppl); }
.suggestion-icon { font-size: 14px; flex-shrink: 0; }
.suggestion-text { flex: 1; font-size: 14px; font-weight: 500; }
.suggestion-type { font-size: 11px; opacity: 0.35; flex-shrink: 0; }
</style>