<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NLayoutHeader, NButton } from 'naive-ui'
import { MODULES } from '../data/modules.js'
import { useFavorites } from '../composables/useFavorites'
import { useRecent } from '../composables/useRecent'

defineProps({
  isDark: Boolean,
  compactMode: Boolean,
})
const emit = defineEmits(['toggleTheme', 'toggleCompact'])

const router = useRouter()
const route = useRoute()
const { favoritesList } = useFavorites()
const { recentList } = useRecent()

const currentModuleId = computed(() => route.params.module || null)

function go(id) {
  router.push(`/${id}`)
}
</script>

<template>
  <NLayoutHeader bordered class="app-header">
    <div class="header-inner">
      <div class="header-left">
        <span class="header-title" @click="go('linux')">📖 Command Book</span>
        <div class="module-switcher">
          <NButton
            v-for="m in Object.values(MODULES)"
            :key="m.id"
            :type="currentModuleId === m.id ? 'primary' : 'default'"
            size="tiny"
            @click="go(m.id)"
          >
            {{ m.icon }} {{ m.name }}
          </NButton>
        </div>
      </div>

      <div class="header-right">
        <NButton size="tiny" secondary round @click="router.push('/recent')">
          🕘 最近<span v-if="recentList.length" class="nav-count">{{ recentList.length }}</span>
        </NButton>
        <NButton size="tiny" secondary round @click="router.push('/favorites')">
          ⭐ 收藏<span v-if="favoritesList.length" class="nav-count">{{ favoritesList.length }}</span>
        </NButton>
        <NButton text size="small" @click="emit('toggleCompact')">
          {{ compactMode ? '📋 展开' : '📋 紧凑' }}
        </NButton>
        <NButton text size="small" @click="emit('toggleTheme')">
          {{ isDark ? '☀️ 亮色' : '🌙 暗色' }}
        </NButton>
      </div>
    </div>
  </NLayoutHeader>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  height: 52px;
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.header-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.3px;
  cursor: pointer;
}
.module-switcher { display: flex; align-items: center; gap: 4px; }
.header-right { display: flex; align-items: center; gap: 8px; }
.nav-count {
  margin-left: 4px;
  font-size: 11px;
  background: var(--n-primary-color, #2080f0);
  color: #fff;
  border-radius: 8px;
  padding: 0 6px;
  line-height: 16px;
}
</style>