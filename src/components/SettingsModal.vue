<script setup>
import { useFavorites } from '../composables/useFavorites'
import { useRecent } from '../composables/useRecent'
import { useSettings, RECENT_LIMIT_OPTIONS } from '../composables/useSettings'
import { useMessage } from 'naive-ui'
import { NModal, NCard, NRadioGroup, NRadioButton, NButton, NPopconfirm, NSpace } from 'naive-ui'

const { clear: clearFavorites, favoritesList } = useFavorites()
const { clear: clearRecent, recentList } = useRecent()
const { recentLimit, setRecentLimit } = useSettings()
const message = useMessage()

const show = defineModel('show', { type: Boolean, default: false })

function onClearFavorites() {
  clearFavorites()
  message.success('已清空收藏')
}
function onClearRecent() {
  clearRecent()
  message.success('已清空最近查看')
}
</script>

<template>
  <NModal v-model:show="show" preset="card" title="⛭ 设置" :bordered="false" style="max-width: 420px">
    <div class="settings-section">
      <div class="section-title">最近查看保留条数</div>
      <NRadioGroup v-model:value="recentLimit.value" name="recent-limit">
        <NRadioButton v-for="n in RECENT_LIMIT_OPTIONS" :key="n" :value="n">
          {{ n }} 条
        </NRadioButton>
      </NRadioGroup>
    </div>

    <div class="settings-section">
      <div class="section-title">数据管理</div>
      <NSpace>
        <NPopconfirm @positive-click="onClearFavorites">
          <template #trigger>
            <NButton tertiary type="warning" :disabled="!favoritesList.length">
              清空收藏（{{ favoritesList.length }}）
            </NButton>
          </template>
          确定清空全部收藏吗？此操作不可恢复。
        </NPopconfirm>
        <NPopconfirm @positive-click="onClearRecent">
          <template #trigger>
            <NButton tertiary type="warning" :disabled="!recentList.length">
              清空最近查看（{{ recentList.length }}）
            </NButton>
          </template>
          确定清空全部最近查看吗？此操作不可恢复。
        </NPopconfirm>
      </NSpace>
    </div>
  </NModal>
</template>

<style scoped>
.settings-section {
  margin-bottom: 20px;
}
.section-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  opacity: 0.75;
}
</style>