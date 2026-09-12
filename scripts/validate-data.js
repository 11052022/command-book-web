// 数据契约校验：npm run check
// 扫描 src/data 下所有命令 JSON 与配方 JSON，缺失/类型错误字段直接报错退出。
// 目的：在 dev/build 之前拦截手写数据违约（历史上 recipe 缺 _type 就曾导致整页黑屏）。
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_ROOT = join(__dirname, '..', 'src', 'data')

const DANGER_LEVELS = ['low', 'medium', 'high', 'critical']

const REQUIRED_COMMAND = {
  name: (v) => typeof v === 'string' && v.length > 0,
  description: (v) => typeof v === 'string' && v.length > 0,
  synopsis: (v) => typeof v === 'string',
  category: (v) => typeof v === 'string' && v.length > 0,
  danger_level: (v) => DANGER_LEVELS.includes(v),
  tags: (v) => Array.isArray(v) && v.every((t) => typeof t === 'string'),
  examples: (v) =>
    Array.isArray(v) &&
    v.every(
      (e) =>
        e &&
        typeof e.description === 'string' &&
        typeof e.code === 'string' &&
        e.code.length > 0
    ),
}

const REQUIRED_RECIPE = {
  name: (v) => typeof v === 'string' && v.length > 0,
  description: (v) => typeof v === 'string' && v.length > 0,
  fullCommand: (v) => typeof v === 'string' && v.length > 0,
  steps: (v) =>
    Array.isArray(v) &&
    v.every(
      (s) =>
        s &&
        typeof s.description === 'string' &&
        typeof s.code === 'string' &&
        s.code.length > 0
    ),
  tags: (v) => Array.isArray(v) && v.every((t) => typeof t === 'string'),
}

const errors = []
let commandCount = 0
let recipeCount = 0

function checkItem(file, schema, requiredKeys) {
  let item
  try {
    item = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    errors.push(`[JSON 解析失败] ${file}: ${e.message}`)
    return
  }
  for (const key of requiredKeys) {
    if (!(key in item)) {
      errors.push(`[缺字段] ${file}: 缺少 "${key}"`)
      continue
    }
    const validator = schema[key]
    if (validator && !validator(item[key])) {
      errors.push(`[格式错误] ${file}: "${key}" 的值不符合类型要求`)
    }
  }
}

function walkCommands(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walkCommands(full)
    } else if (entry.endsWith('.json')) {
      checkItem(full, REQUIRED_COMMAND, Object.keys(REQUIRED_COMMAND))
      commandCount++
    }
  }
}

// 各模块 recipes/recipes.json
function walkRecipes(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walkRecipes(full)
      continue
    }
    if (entry === 'recipes.json') {
      let list
      try {
        list = JSON.parse(readFileSync(full, 'utf8'))
      } catch (e) {
        errors.push(`[JSON 解析失败] ${full}: ${e.message}`)
        continue
      }
      if (!Array.isArray(list)) {
        errors.push(`[格式错误] ${full}: 应为数组`)
        continue
      }
      list.forEach((item, i) => {
        const label = `${full}#[${i}]`
        for (const key of Object.keys(REQUIRED_RECIPE)) {
          if (!(key in item)) {
            errors.push(`[缺字段] ${label}: 缺少 "${key}"`)
            continue
          }
          if (!REQUIRED_RECIPE[key](item[key])) {
            errors.push(`[格式错误] ${label}: "${key}" 不符合类型要求`)
          }
        }
      })
      recipeCount += list.length
    }
  }
}

for (const moduleName of readdirSync(DATA_ROOT)) {
  const moduleRoot = join(DATA_ROOT, moduleName)
  if (!statSync(moduleRoot).isDirectory()) continue
  walkCommands(join(moduleRoot, 'commands'))
  walkRecipes(join(moduleRoot, 'recipes'))
}

if (errors.length > 0) {
  console.error(`❌ 数据校验失败：共 ${errors.length} 个问题\n`)
  errors.forEach((e) => console.error(`  ${e}`))
  console.error(`\n检查了 ${commandCount} 条命令 / ${recipeCount} 个配方。修复后重新运行 npm run check。`)
  process.exit(1)
}

console.log(`✅ 数据校验通过：${commandCount} 条命令 / ${recipeCount} 个配方，字段契约完整。`)