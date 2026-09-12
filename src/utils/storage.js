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