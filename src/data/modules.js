// 模块注册表：模块元信息与数据加载器分离。
//
// 元信息（id/name/icon/defaultLang）同步打包进主包，用于顶部导航等轻量场景；
// 命令/配方数据通过 loadModule 按需动态加载——进哪个模块才拉取哪份数据，
// 避免用户只浏览一个模块时也要下载全部命令数据。

export const MODULES = {
  linux: {
    id: 'linux',
    name: 'Linux',
    icon: '🐧',
    defaultLang: 'bash',
  },
  redis: {
    id: 'redis',
    name: 'Redis',
    icon: '🔴',
    defaultLang: 'redis',
  },
  git: {
    id: 'git',
    name: 'Git',
    icon: '🔀',
    defaultLang: 'bash',
  },
}

export const DEFAULT_MODULE = 'linux'

// 各模块数据按需加载器：动态 import，构建期自动拆出独立 chunk
const loaders = {
  linux: () =>
    Promise.all([
      import('./linux/index.js'),
      import('./linux/recipes/index.js'),
    ]).then(([cmds, recipes]) => ({
      commands: cmds.ALL_COMMANDS,
      recipes: recipes.ALL_RECIPES,
    })),
  redis: () =>
    Promise.all([
      import('./redis/index.js'),
      import('./redis/recipes/index.js'),
    ]).then(([cmds, recipes]) => ({
      commands: cmds.ALL_COMMANDS,
      recipes: recipes.ALL_RECIPES,
    })),
  git: () =>
    Promise.all([
      import('./git/index.js'),
      import('./git/recipes/index.js'),
    ]).then(([cmds, recipes]) => ({
      commands: cmds.ALL_COMMANDS,
      recipes: recipes.ALL_RECIPES,
    })),
}

/**
 * 按需加载指定模块的命令与配方数据。
 * @param {string} moduleId 'linux' | 'redis' | 'git'
 * @returns {Promise<{commands: Array, recipes: Array}>}
 */
export async function loadModule(moduleId) {
  const loader = loaders[moduleId]
  if (!loader) throw new Error(`未知模块: ${moduleId}`)
  return loader()
}