<script setup>
import { inject, provide, ref, watch, nextTick } from 'vue'
import { NEmpty } from 'naive-ui'
import CommandCard from './CommandCard.vue'
import RecipeCard from './RecipeCard.vue'

const props = defineProps({
  commands: { type: Array, default: () => [] },
  selectedIndex: { type: Number, default: -1 },
})

const emit = defineEmits(['navigate'])
const matchedTags = inject('matchedTags', () => ({ value: [] }))

provide('itemCount', () => props.commands.length)

// 列表滚动跟随键盘选择
const listRef = ref(null)
watch(
  () => props.selectedIndex,
  (idx) => {
    if (idx >= 0 && listRef.value) {
      nextTick(() => {
        const cards = listRef.value.querySelectorAll('.command-card, .recipe-card')
        cards[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }
  }
)
</script>

<template>
  <div ref="listRef" class="command-list">
    <NEmpty
      v-if="commands.length === 0"
      description="没有找到匹配的命令，试试换个说法"
      class="empty-state"
    >
      <template #extra>
        <p class="empty-hint">试试搜索：删除文件、查看进程、磁盘空间、网络连接...</p>
      </template>
    </NEmpty>

    <div v-for="(item, i) in commands" :key="(item._type === 'recipe' ? 'rcp-' : 'cmd-') + item.name">
      <template v-if="item._type !== 'recipe'">
        <CommandCard
          :command="item"
          :selected="i === selectedIndex"
          :matched-tags="matchedTags"
          @navigate="(name) => emit('navigate', name)"
        />
      </template>
      <template v-else>
        <RecipeCard
          :recipe="item"
          :selected="i === selectedIndex"
          :matched-tags="matchedTags"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.command-list { min-height: 200px; }
.empty-state { margin-top: 80px; }
.empty-hint { font-size: 13px; opacity: 0.5; }
.card-list-enter-active { transition: all 0.3s ease; }
.card-list-leave-active { transition: all 0.2s ease; }
.card-list-enter-from { opacity: 0; transform: translateY(-8px); }
.card-list-leave-to { opacity: 0; }
.card-list-move { transition: transform 0.3s ease; }
</style>