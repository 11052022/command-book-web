import recipes from './recipes.json'

export const ALL_RECIPES = recipes.map((r) => ({ ...r, _type: 'recipe' }))
