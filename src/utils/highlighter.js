import { createHighlighter } from 'shiki'

// Shiki 全局单例：整个应用只初始化一次 highlighter（网络包已拆为独立 chunk，懒加载）。
let highlighterPromise = null

// 渲染结果缓存：key = `${theme}|${lang}|${code}`
const cache = new Map()

// Shiki 不支持 redis 语法，回退到 bash（Redis CLI 命令的 shell 高亮效果足够）
const SHIKI_LANG_MAP = {
  redis: 'bash',
}

function getHighlighter() {
  if (!highlighterPromise) {
    // 动态 import：shiki 体积大，只在实际需要高亮时才加载对应 chunk
    highlighterPromise = import('shiki').then(({ createHighlighter: create }) =>
      create({
        themes: ['github-dark', 'github-light'],
        langs: ['bash', 'shell', 'lua'],
      })
    )
  }
  return highlighterPromise
}

/**
 * 将代码片段渲染为带语法高亮的 HTML（带结果缓存）。
 * @param {string} code    要高亮的源码
 * @param {string} rawLang 原始语言（支持 redis，自动映射为 bash）
 * @param {string} theme   'github-dark' | 'github-light'
 */
export async function highlightCode(code, rawLang = 'bash', theme = 'github-dark') {
  const lang = SHIKI_LANG_MAP[rawLang] || rawLang
  const key = `${theme}|${lang}|${code}`
  if (cache.has(key)) return cache.get(key)

  const highlighter = await getHighlighter()
  const html = highlighter.codeToHtml(code || '', { lang, theme })
  cache.set(key, html)
  return html
}