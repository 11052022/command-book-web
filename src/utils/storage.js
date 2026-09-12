// localStorage 读写的小封装：统一 JSON 序列化 + 容错（隐私模式/禁用时降级为空对象）

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 忽略：写入失败不影响使用（收藏/最近查看仅本次会话有效）
  }
}

// 跨标签页同步：监听 storage 事件，其它标签页改了对应 key 时，
// 通过 reload 重新读取并回调刷新（同一标签页内 setItem 不会触发本事件，无循环风险）。
export function syncOnStorage(key, fallback, onUpdate) {
  window.addEventListener('storage', (e) => {
    // e.key === null 表示 localStorage.clear() 被调用
    if (e.key === null || e.key === key) onUpdate(loadJSON(key, fallback))
  })
}