import { ref, onMounted, onUnmounted } from 'vue'

/** Vim 风格键盘导航：/ 聚焦搜索，j/k 或上下移动，Enter 展开，l 跳相关命令，Esc 清空/收起 */
export function useKeyboard({ itemCount, onExpand, onRelated, getSelectedCommand }) {
  const selectedIndex = ref(-1)
  const searchInputRef = ref(null)

  function handleKeydown(e) {
    const tag = e.target?.tagName
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA'

    if (e.key === '/' && !isInput) {
      e.preventDefault()
      searchInputRef.value?.focus()
      return
    }

    const count = typeof itemCount === 'function' ? itemCount() : 0

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (count > 0) {
        selectedIndex.value =
          e.key === 'ArrowDown'
            ? Math.min(selectedIndex.value + 1, count - 1)
            : Math.max(selectedIndex.value - 1, -1)
      }
      return
    }

    if (isInput) {
      if (e.key === 'Escape') {
        e.target.value = ''
        e.target.blur()
        selectedIndex.value = -1
      }
      return
    }

    switch (e.key) {
      case 'j':
        e.preventDefault()
        if (count > 0) selectedIndex.value = Math.min(selectedIndex.value + 1, count - 1)
        break
      case 'k':
        e.preventDefault()
        selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex.value >= 0 && onExpand) onExpand(selectedIndex.value)
        break
      case 'l':
        e.preventDefault()
        if (selectedIndex.value >= 0 && onRelated && getSelectedCommand) {
          const cmd = getSelectedCommand()
          if (cmd && cmd.related && cmd.related.length > 0) onRelated(cmd.related[0])
        }
        break
      case 'Escape':
        e.preventDefault()
        selectedIndex.value = -1
        break
    }
  }

  onMounted(() => window.addEventListener('keydown', handleKeydown))
  onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

  return { selectedIndex, searchInputRef }
}