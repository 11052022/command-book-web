// Shared data module — loaded once, consumed by both useSearch and CategoryTree
const commandModules = import.meta.glob('./commands/**/*.json', {
  eager: true,
})

export const ALL_COMMANDS = Object.values(commandModules).map((m) => m.default ?? m)
