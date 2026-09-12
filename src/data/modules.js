import { ALL_COMMANDS as linuxCommands } from './linux/index.js'
import { ALL_RECIPES as linuxRecipes } from './linux/recipes/index.js'
import { ALL_COMMANDS as redisCommands } from './redis/index.js'
import { ALL_RECIPES as redisRecipes } from './redis/recipes/index.js'
import { ALL_COMMANDS as gitCommands } from './git/index.js'
import { ALL_RECIPES as gitRecipes } from './git/recipes/index.js'

export const MODULES = {
  linux: {
    id: 'linux',
    name: 'Linux',
    icon: '🐧',
    commands: linuxCommands,
    recipes: linuxRecipes,
    defaultLang: 'bash',
  },
  redis: {
    id: 'redis',
    name: 'Redis',
    icon: '🔴',
    commands: redisCommands,
    recipes: redisRecipes,
    defaultLang: 'redis',
  },
  git: {
    id: 'git',
    name: 'Git',
    icon: '🔀',
    commands: gitCommands,
    recipes: gitRecipes,
    defaultLang: 'bash',
  },
}

export const DEFAULT_MODULE = 'linux'
