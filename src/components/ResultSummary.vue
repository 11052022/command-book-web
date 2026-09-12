<script setup>
defineProps({
  count: { type: Number, default: 0 },
  recipeCount: { type: Number, default: 0 },
  category: { type: String, default: null },
})
</script>

<template>
  <div class="result-summary">
    <template v-if="category">
      <span class="summary-cat">📁 {{ category }}</span>
      <span class="summary-sep">·</span>
    </template>
    <span class="summary-text">
      {{ count }} 条命令<template v-if="recipeCount > 0"> · {{ recipeCount }} 个配方</template>
    </span>
  </div>
</template>

<style scoped>
.result-summary {
  margin-bottom: 12px;
  font-size: 12px;
  opacity: 0.55;
  padding: 0 4px;
}
.summary-cat { font-weight: 600; }
.summary-sep { margin: 0 6px; opacity: 0.4; }
</style>