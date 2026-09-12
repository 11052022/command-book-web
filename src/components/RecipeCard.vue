<script setup>
import { ref, computed, watch, inject } from 'vue'
import { NCollapse, NCollapseItem, NTag } from 'naive-ui'
import { highlightCode } from '../utils/highlighter'
import { useTheme } from '../composables/useTheme'
import { useModule } from '../composables/useModule'

const props = defineProps({
  recipe: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

const { isDark } = useTheme()
const { currentModule } = useModule()
const expanded = ref(false)

// ---- 注入 ----
const matchedTags = inject('matchedTags', () => ({ value: [] }))
const isFav = inject('isFav', () => false)
const toggleFavorite = inject('handleToggleFavorite', () => {})
const recordViewed = inject('recordViewed', () => {})
const message = inject('cb_message', null)

// ---- Shiki 高亮（全局单例 + 缓存，redis 回退 bash） ----
const highlightedFull = ref('')
const highlightedSteps = ref([])
const highlightReady = ref(false)

function shikiTheme() {
  return isDark.value ? 'github-dark' : 'github-light'
}

async function initHighlighter() {
  const theme = shikiTheme()
  const rawLang = props.recipe.lang || currentModule.value?.defaultLang || 'bash'
  highlightedFull.value = await highlightCode(props.recipe.fullCommand || '', rawLang, theme)
  highlightedSteps.value = await Promise.all(
    (props.recipe.steps || []).map((s) => highlightCode(s.code, rawLang, theme))
  )
  highlightReady.value = true
}

watch([() => props.recipe.name, isDark], () => {
  highlightReady.value = false
  initHighlighter()
}, { immediate: true })

// ---- 收藏 ----
const isStarred = computed(() => isFav(props.recipe._module || 'linux', 'recipe', props.recipe.name))
function onToggleStar(e) {
  e.stopPropagation()
  toggleFavorite({ ...props.recipe, _module: props.recipe._module })
}

// ---- 复制 ----
async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code)
    message?.success?.('已复制到剪贴板')
  } catch {
    message?.error?.('复制失败，请手动选择复制')
  }
}

function isTagMatched(tag) {
  return matchedTags.value?.includes(tag) ?? false
}
</script>

<template>
  <div class="recipe-card" :class="{ 'recipe-card--selected': selected }">
    <div class="recipe-header" @click="expanded = !expanded; recordViewed({ ...props.recipe })">
      <div class="recipe-header-left">
        <button
          class="star-btn"
          :class="{ 'star-btn--on': isStarred }"
          :title="isStarred ? '取消收藏' : '收藏'"
          @click="onToggleStar"
        >{{ isStarred ? '★' : '☆' }}</button>
        <span class="recipe-badge">📋 配方</span>
        <span class="recipe-name">{{ recipe.name }}</span>
        <NTag v-if="recipe._module" size="small" :bordered="false" class="module-badge">
          {{ recipe._module }}
        </NTag>
      </div>
      <span class="expand-indicator">{{ expanded ? '▾' : '▸' }}</span>
    </div>

    <p class="recipe-desc">{{ recipe.description }}</p>

    <div class="recipe-fullcmd">
      <div class="fullcmd-label">一键执行：</div>
      <div v-if="highlightReady" class="fullcmd-code" v-html="highlightedFull"></div>
      <pre v-else class="fullcmd-fallback"><code>{{ recipe.fullCommand }}</code></pre>
      <button class="copy-btn" title="复制完整命令" @click.stop="copyCode(recipe.fullCommand)">📋</button>
    </div>

    <div v-if="expanded" class="recipe-body">
      <div class="tags-row">
        <span
          v-for="tag in recipe.tags"
          :key="tag"
          class="recipe-tag"
          :class="{ 'tag-highlighted': isTagMatched(tag) }"
        >{{ tag }}</span>
      </div>

      <NCollapse class="steps-collapse">
        <NCollapseItem title="分步拆解" name="steps">
          <div v-for="(s, i) in recipe.steps" :key="i" class="step-item">
            <div class="step-desc">{{ i + 1 }}. {{ s.description }}</div>
            <div class="code-wrapper">
              <div v-if="highlightReady && highlightedSteps[i]" class="step-code" v-html="highlightedSteps[i]"></div>
              <pre v-else class="step-fallback"><code>{{ s.code }}</code></pre>
              <button class="copy-btn" title="复制该步骤" @click.stop="copyCode(s.code)">📋</button>
            </div>
          </div>
        </NCollapseItem>
      </NCollapse>
    </div>
  </div>
</template>

<style scoped>
.recipe-card {
  position: relative;
  border: 1px solid var(--n-border-color);
  border-left: 3px solid #f0a020;
  border-radius: 10px;
  padding: 20px 24px;
  margin-bottom: 12px;
  transition: all 0.15s ease;
  cursor: pointer;
}
.recipe-card:hover { border-color: #f0a020; }
.recipe-card--selected {
  border-color: #f0a020;
  background: rgba(240, 160, 32, 0.06);
  box-shadow: 0 0 0 1px #f0a020, 0 0 20px -8px rgba(240, 160, 32, 0.5);
}

.recipe-header { display: flex; align-items: center; justify-content: space-between; }
.recipe-header-left { display: flex; align-items: center; gap: 10px; }
.star-btn {
  background: none; border: none; cursor: pointer;
  font-size: 18px; line-height: 1; padding: 2px;
  color: var(--n-text-color-3, #888); transition: color 0.12s, transform 0.12s;
}
.star-btn:hover { transform: scale(1.15); }
.star-btn--on { color: var(--n-primary-color, #2080f0); }
.recipe-badge {
  font-size: 11px; font-weight: 700;
  color: #f0a020; border: 1px solid rgba(240, 160, 32, 0.5);
  border-radius: 6px; padding: 1px 8px;
}
.recipe-name { font-size: 18px; font-weight: 700; }
.module-badge { opacity: 0.65; text-transform: uppercase; }
.expand-indicator { font-size: 14px; opacity: 0.4; }

.recipe-desc { margin-top: 8px; font-size: 14px; opacity: 0.8; line-height: 1.5; }

.recipe-fullcmd { margin-top: 12px; position: relative; }
.fullcmd-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.4; margin-bottom: 6px; }
.fullcmd-code :deep(pre) { background: rgba(127, 127, 127, 0.1) !important; }
.fullcmd-fallback { background: rgba(127, 127, 127, 0.1); padding: 12px 16px; border-radius: 8px; }
.copy-btn {
  position: absolute; bottom: 12px; right: 8px;
  background: none; border: none; cursor: pointer; font-size: 16px; opacity: 0.4;
  transition: opacity 0.15s;
}
.copy-btn:hover { opacity: 1; }

.recipe-body { margin-top: 16px; }
.tags-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.recipe-tag {
  display: inline-block; padding: 2px 10px; border-radius: 12px;
  font-size: 12px; opacity: 0.55; background: rgba(127, 127, 127, 0.1);
}
.recipe-tag.tag-highlighted { opacity: 1; background: var(--n-primary-color-suppl); color: var(--n-primary-color); font-weight: 600; }
.steps-collapse { margin-bottom: 8px; }
.step-item { margin-bottom: 10px; }
.step-desc { font-size: 13px; margin-bottom: 6px; opacity: 0.85; }
.code-wrapper { position: relative; }
.step-code :deep(pre) { background: rgba(127, 127, 127, 0.1) !important; }
.step-fallback { background: rgba(127, 127, 127, 0.1); padding: 12px 16px; border-radius: 8px; }
</style>