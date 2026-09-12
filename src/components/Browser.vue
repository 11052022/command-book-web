<script setup>
import { computed, provide, ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { NLayout, NLayoutSider, NLayoutContent } from 'naive-ui'
import SearchBar from './SearchBar.vue'
import CategoryTree from './CategoryTree.vue'
import CommandList from './CommandList.vue'
import ResultSummary from './ResultSummary.vue'
import { MODULES } from '../data/modules.js'
import { useSearch } from '../composables/useSearch'
import { useKeyboard } from '../composables/useKeyboard'
import { useSuggestions } from '../composables/useSuggestions'
import { useFavorites } from '../composables/useFavorites'
import { useRecent } from '../composables/useRecent'

const props = defineProps({
  // 非模块页：'favorites' | 'recent'；模块页由路由参数决定
  mode: { type: String, default: null },
})

const route = useRoute()
const { favoritesList, isFav, toggle: toggleFavorite } = useFavorites()
const { recentList, record: recordRecent } = useRecent()

const moduleId = computed(() => route.params.module || null)
const currentModule = computed(() => (moduleId.value ? MODULES[moduleId.value] : null))
const viewMode = computed(() => props.mode || 'module')

// ---- 数据源：模块 / 收藏 / 最近，统一做 _type/_module 契约 ----
const favCommands = computed(() => favoritesList.value.filter((f) => f.type === 'command').map((f) => f.item))
const favRecipes = computed(() => favoritesList.value.filter((f) => f.type === 'recipe').map((f) => f.item))
const recCommands = computed(() => recentList.value.filter((r) => r.type === 'command').map((r) => r.item))
const recRecipes = computed(() => recentList.value.filter((r) => r.type === 'recipe').map((r) => r.item))

const commands = computed(() => {
  if (viewMode.value === 'favorites') return favCommands.value
  if (viewMode.value === 'recent') return recCommands.value
  return (currentModule.value?.commands ?? []).map((c) => ({ ...c, _module: moduleId.value }))
})
const recipes = computed(() => {
  if (viewMode.value === 'favorites') return favRecipes.value
  if (viewMode.value === 'recent') return recRecipes.value
  return (currentModule.value?.recipes ?? []).map((r) => ({ ...r, _module: moduleId.value }))
})

// ---- 搜索（数据源注入式） ----
const {
  searchInput, activeCategory, typeFilter, expandedCommand,
  matchedCommands, matchedTags, reset: resetSearch,
} = useSearch({ commands, recipes })
const { suggestions } = useSuggestions(searchInput, { commands })

const searchCommands = computed(() => commands.value)
provide('viewCommands', searchCommands)

// 路由/视图切换 → 清空跨页面搜索状态；同路由内 props 变化不重置（保持体验稳定）
let lastPath = route.fullPath
watch(
  () => route.fullPath,
  (path) => {
    if (path !== lastPath) {
      lastPath = path
      resetSearch()
    }
  }
)

// ---- 收藏/最近 交互接线（注入给卡片） ----
function handleToggleFavorite(item) {
  const m = item._module || moduleId.value || 'linux'
  toggleFavorite(m, item._type || 'command', item)
  // 收藏页移除时自然消失
  if (viewMode.value === 'favorites' && !isFav(m, item._type || 'command', item.name)) {
    // no-op：列表由 favoritesList 驱动，已自动移除
  }
}
function handleRecordViewed(item) {
  const m = item._module || moduleId.value || 'linux'
  recordRecent(m, item._type || 'command', item)
}
provide('isFav', isFav)
provide('handleToggleFavorite', handleToggleFavorite)
provide('recordViewed', handleRecordViewed)

// ---- 键盘导航 ----
const selectedIndex = ref(-1)
function navigateToCommand(commandName) {
  activeCategory.value = null
  searchInput.value = commandName
  nextTick(() => {
    expandedCommand.value = commandName
  })
}
const { selectedIndex: kbIndex, searchInputRef } = useKeyboard({
  itemCount: () => matchedCommands.value.length,
  onExpand: (idx) => {
    const item = matchedCommands.value[idx]
    if (item) {
      expandedCommand.value = expandedCommand.value === item.name ? null : item.name
      if (expandedCommand.value) handleRecordViewed(item)
    }
  },
  getSelectedCommand: () => matchedCommands.value[kbIndex.value],
  onRelated: (name) => navigateToCommand(name),
})
watch(kbIndex, (v) => { selectedIndex.value = v })

provide('matchedTags', matchedTags)
provide('expandedCommand', expandedCommand)

// SearchBar 依赖的注入（匹配列表 + 类型过滤读写）
provide('viewMatched', matchedCommands)
provide('viewTypeFilter', typeFilter)
provide('setTypeFilter', (v) => { typeFilter.value = v })

// ---- 回到顶部 ----
const showBackTop = ref(false)
function onWindowScroll() {
  showBackTop.value = window.scrollY > 400
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
onMounted(() => window.addEventListener('scroll', onWindowScroll))
onUnmounted(() => window.removeEventListener('scroll', onWindowScroll))

const titleMap = { favorites: '我的收藏', recent: '最近查看', module: '' }
</script>

<template>
  <div class="browser-page">
    <NLayout has-sider class="browser-body">
      <!-- 侧栏：仅模块页显示分类 -->
      <NLayoutSider
        v-if="viewMode === 'module'"
        bordered
        collapse-mode="transform"
        :collapsed-width="0"
        :width="220"
        :native-scrollbar="false"
        class="app-sider"
      >
        <div class="sider-inner">
          <div class="sider-header"><span class="sider-title">命令分类</span></div>
          <CategoryTree v-model:active-category="activeCategory" />
        </div>
      </NLayoutSider>

      <NLayoutContent class="app-content">
        <div class="content-wrapper">
          <!-- 收藏/最近视图说明 -->
          <div v-if="viewMode !== 'module'" class="view-banner">
            <span class="view-title">{{ titleMap[viewMode] }}</span>
            <span class="view-hint">共 {{ matchedCommands.length }} 条 · 支持搜索过滤</span>
          </div>

          <SearchBar
            ref="searchInputRef"
            v-model:search-input="searchInput"
            :suggestions="suggestions"
          />
          <ResultSummary
            :count="matchedCommands.filter((r) => r._type !== 'recipe').length"
            :recipe-count="matchedCommands.filter((r) => r._type === 'recipe').length"
            :category="activeCategory"
          />
          <CommandList
            :commands="matchedCommands"
            :selected-index="selectedIndex"
            @navigate="navigateToCommand"
          />
        </div>

        <Transition name="fade">
          <div v-if="showBackTop" class="back-top-btn" @click="scrollToTop" title="回到顶部">
            <span class="back-top-arrow">▲</span>
          </div>
        </Transition>
      </NLayoutContent>
    </NLayout>
  </div>
</template>

<style scoped>
.browser-body {
  padding-top: 52px;
}
.app-sider {
  position: fixed;
  top: 52px;
  left: 0;
  bottom: 0;
  width: 220px;
  z-index: 1500;
}
.sider-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-top: 12px;
}
.sider-header {
  flex-shrink: 0;
  padding: 0 16px 12px;
  border-bottom: 1px solid var(--n-border-color);
  margin-bottom: 8px;
}
.sider-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.6;
}
.app-content {
  margin-left: 220px;
  display: flex;
  justify-content: center;
}
.content-wrapper {
  width: 100%;
  max-width: 860px;
  padding: 24px 40px;
}
.view-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.view-title {
  font-size: 18px;
  font-weight: 700;
}
.view-hint {
  font-size: 12px;
  opacity: 0.5;
}
.back-top-btn {
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--n-primary-color, #2080f0);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  z-index: 1000;
  transition: transform 0.15s, box-shadow 0.15s;
}
.back-top-btn:hover {
  transform: translateY(-2px);
}
.back-top-arrow {
  font-size: 18px;
  line-height: 1;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(8px); }
</style>