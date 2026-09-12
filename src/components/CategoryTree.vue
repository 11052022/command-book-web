<script setup>
import { computed, inject } from 'vue'
import { NTree } from 'naive-ui'
import { useModule } from '../composables/useModule.js'

const props = defineProps({
  activeCategory: { type: String, default: null },
})
const emit = defineEmits(['update:activeCategory'])

const { currentModule } = useModule()
const viewCommands = inject('viewCommands', { value: [] })

// 优先使用当前视图的命令列表（模块页同源，收藏/最近页自动归零/隐藏侧栏）
const commands = computed(() => viewCommands.value.length ? viewCommands.value : (currentModule.value?.commands ?? []))

const treeData = computed(() => [
  { label: '全部命令', key: '__all__' },
  ...[...new Set(commands.value.map((c) => c.category))].map((cat) => ({
    label: `${cat} (${commands.value.filter((c) => c.category === cat).length})`,
    key: cat,
  })),
])

function handleSelect(keys) {
  emit('update:activeCategory', keys.length === 0 || keys[0] === '__all__' ? null : keys[0])
}
</script>

<template>
  <NTree
    :data="treeData"
    :selected-keys="activeCategory ? [activeCategory] : ['__all__']"
    :selectable="true"
    :block-line="true"
    :node-props="() => ({ style: { cursor: 'pointer', padding: '2px 12px' } })"
    @update:selected-keys="handleSelect"
  />
</template>