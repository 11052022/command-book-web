<script setup>
import { ref, computed, watch, inject } from 'vue'
import { NTag, NCollapse, NCollapseItem } from 'naive-ui'
import { highlightCode } from '../utils/highlighter'
import { useTheme } from '../composables/useTheme'

const props = defineProps({
  command: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})
const emit = defineEmits(['navigate'])

const { isDark } = useTheme()

// ---- 由 App/Browser 注入 ----
const compactMode = inject('compactMode', { value: false })
const expandedCommand = inject('expandedCommand')
const matchedTags = inject('matchedTags', () => ({ value: [] }))
const isFav = inject('isFav', () => false)
const toggleFavorite = inject('handleToggleFavorite', () => {})
const recordViewed = inject('recordViewed', () => {})

const expanded = computed({
  get: () => expandedCommand.value === props.command.name,
  set: (val) => {
    expandedCommand.value = val ? props.command.name : null
    if (val) recordViewed({ ...props.command }) // 展开即记入最近查看
  },
})

// ---- Shiki 高亮（全局单例 + 缓存） ----
const highlightedSynopsis = ref('')
const highlightedExamples = ref([])
const highlightReady = ref(false)

function shikiTheme() {
  return isDark.value ? 'github-dark' : 'github-light'
}

async function initHighlighter() {
  const theme = shikiTheme()
  highlightedSynopsis.value = await highlightCode(props.command.synopsis || '', 'bash', theme)
  highlightedExamples.value = await Promise.all(
    (props.command.examples || []).map((ex) => highlightCode(ex.code, 'bash', theme))
  )
  highlightReady.value = true
}

watch([() => props.command.name, isDark], () => {
  highlightReady.value = false
  initHighlighter()
}, { immediate: true })

// ---- 危险等级 ----
const dangerConfig = {
  low: { type: 'success', label: '低危' },
  medium: { type: 'warning', label: '中危' },
  high: { type: 'error', label: '高危' },
  critical: { type: 'error', label: '极高危' },
}
const danger = computed(() => dangerConfig[props.command.danger_level] ?? dangerConfig.medium)

const collapseNames = computed(() => {
  if (!expanded.value) return []
  const names = []
  if (props.command.common_options?.length) names.push('options')
  if (props.command.examples?.length) names.push('examples')
  return names
})

// ---- 收藏 ----
const favKey = computed(() => props.command._module)
const isStarred = computed(() =>
  isFav(favKey.value || 'linux', 'command', props.command.name)
)
function onToggleStar(e) {
  e.stopPropagation()
  toggleFavorite({ ...props.command, _module: props.command._module })
}

// ---- 标签高亮 ----
function isTagMatched(tag) {
  return matchedTags.value?.includes(tag) ?? false
}

// ---- 复制 ----
const message = inject('cb_message', null)
async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code)
    message?.success?.('已复制到剪贴板')
  } catch {
    message?.error?.('复制失败，请手动选择复制')
  }
}
</script>

<template>
  <div class="command-card" :class="{ 'command-card--selected': selected, 'command-card--compact': compactMode }">
    <div class="card-header" @click="expanded = !expanded">
      <div class="card-header-left">
        <button
          class="star-btn"
          :class="{ 'star-btn--on': isStarred }"
          :title="isStarred ? '取消收藏' : '收藏'"
          @click="onToggleStar"
        >{{ isStarred ? '★' : '☆' }}</button>
        <span class="command-name">{{ command.name }}</span>
        <NTag v-if="command._module" size="small" :bordered="false" class="module-badge">
          {{ command._module }}
        </NTag>
        <NTag :type="danger.type" size="small" :bordered="false" class="danger-badge">
          {{ danger.label }}
        </NTag>
      </div>
      <span class="expand-indicator">{{ expanded ? '▾' : '▸' }}</span>
    </div>

    <p class="command-desc">{{ command.description }}</p>

    <div v-if="highlightReady" class="synopsis-block" v-html="highlightedSynopsis"></div>
    <div v-else class="synopsis-block synopsis-loading">加载中...</div>

    <div v-if="expanded" class="card-body">
      <div class="tags-row">
        <span
          v-for="tag in command.tags"
          :key="tag"
          class="cmd-tag"
          :class="{ 'tag-highlighted': isTagMatched(tag) }"
        >{{ tag }}</span>
      </div>

      <NCollapse v-if="command.common_options?.length" class="options-collapse" :expanded-names="collapseNames">
        <NCollapseItem title="常用参数" name="options">
          <div class="options-list">
            <div v-for="opt in command.common_options" :key="opt.name" class="option-item">
              <code class="option-name">{{ opt.name }}</code>
              <span class="option-desc">{{ opt.description }}</span>
            </div>
          </div>
        </NCollapseItem>
      </NCollapse>

      <NCollapse v-if="command.examples?.length" class="examples-collapse" :expanded-names="collapseNames">
        <NCollapseItem title="示例" name="examples">
          <div v-for="(example, i) in command.examples" :key="i" class="example-item">
            <p class="example-desc">{{ example.description }}</p>
            <div class="code-wrapper">
              <div v-if="highlightReady && highlightedExamples[i]" class="example-code" v-html="highlightedExamples[i]"></div>
              <pre v-else class="example-code-fallback"><code>{{ example.code }}</code></pre>
              <button class="copy-btn" title="复制命令" @click.stop="copyCode(example.code)">📋</button>
            </div>
          </div>
        </NCollapseItem>
      </NCollapse>

      <div v-if="command.related?.length" class="related-row">
        <span class="related-label">相关命令：</span>
        <NTag
          v-for="rel in command.related"
          :key="rel"
          size="small"
          class="related-tag"
          @click="emit('navigate', rel)"
        >{{ rel }}</NTag>
      </div>

      <div class="category-row">
        <span class="category-label">📁 {{ command.category }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.command-card {
  position: relative;
  border: 1px solid var(--n-border-color);
  border-left: 3px solid transparent;
  border-radius: 10px;
  padding: 20px 24px;
  margin-bottom: 12px;
  transition: all 0.15s ease;
  cursor: pointer;
}
.command-card:hover { border-color: var(--n-primary-color-hover); }
.command-card--selected {
  border-color: var(--n-primary-color);
  border-left: 3px solid var(--n-primary-color);
  background: rgba(var(--n-primary-color-rgb, 99 144 255), 0.06);
  box-shadow: 0 0 0 1px var(--n-primary-color), 0 0 20px -8px var(--n-primary-color);
}
.command-card--selected::before {
  content: '▸'; position: absolute; left: -6px; top: 50%; transform: translateY(-50%);
  color: var(--n-primary-color); font-size: 14px; line-height: 1;
}
.command-card--compact { padding: 10px 18px; margin-bottom: 6px; }
.command-card--compact .command-name { font-size: 16px; }
.command-card--compact .command-desc { display: none; }
.command-card--compact .synopsis-block { margin-top: 6px; }
.command-card--compact .synopsis-block :deep(pre) { padding: 6px 12px !important; font-size: 12px; }
.command-card--compact .card-body { margin-top: 10px; }

.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-header-left { display: flex; align-items: center; gap: 10px; }

.star-btn {
  background: none; border: none; cursor: pointer;
  font-size: 18px; line-height: 1; padding: 2px;
  color: var(--n-text-color-3, #888); transition: color 0.12s, transform 0.12s;
}
.star-btn:hover { transform: scale(1.15); }
.star-btn--on { color: var(--n-primary-color, #2080f0); }

.command-name {
  font-size: 20px; font-weight: 700;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: var(--n-primary-color);
}
.module-badge { opacity: 0.65; text-transform: uppercase; }
.danger-badge { font-size: 11px; }
.expand-indicator { font-size: 14px; opacity: 0.4; }

.command-desc { margin-top: 8px; font-size: 14px; opacity: 0.8; line-height: 1.5; }
.synopsis-block { margin-top: 12px; }
.synopsis-block :deep(pre) { background: rgba(127, 127, 127, 0.1) !important; }
.synopsis-loading { padding: 12px 16px; opacity: 0.4; font-style: italic; }

.card-body { margin-top: 16px; }
.tags-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.cmd-tag {
  display: inline-block; padding: 2px 10px; border-radius: 12px;
  font-size: 12px; opacity: 0.55; background: rgba(127, 127, 127, 0.1);
  transition: opacity 0.15s, background 0.15s;
}
.cmd-tag.tag-highlighted {
  opacity: 1; background: var(--n-primary-color-suppl);
  color: var(--n-primary-color); font-weight: 600;
}
.options-collapse, .examples-collapse { margin-bottom: 8px; }
.options-list { display: flex; flex-direction: column; gap: 6px; }
.option-item { display: flex; gap: 12px; align-items: baseline; }
.option-name { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; min-width: 80px; }
.option-desc { font-size: 13px; opacity: 0.7; }
.example-item { margin-bottom: 14px; }
.example-desc { font-size: 13px; margin-bottom: 6px; opacity: 0.8; }
.code-wrapper { position: relative; }
.example-code :deep(pre) { background: rgba(127, 127, 127, 0.1) !important; }
.example-code-fallback { background: rgba(127, 127, 127, 0.1); padding: 12px 16px; border-radius: 8px; }
.copy-btn {
  position: absolute; top: 8px; right: 8px;
  background: none; border: none; cursor: pointer; font-size: 16px; opacity: 0.4;
  transition: opacity 0.15s;
}
.copy-btn:hover { opacity: 1; }
.related-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 12px; }
.related-label { font-size: 13px; opacity: 0.6; }
.related-tag { cursor: pointer; }
.category-row { margin-top: 10px; }
.category-label { font-size: 12px; opacity: 0.6; }
</style>