import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MODULES } from '../data/modules.js'

/**
 * 模块切换由路由驱动（#/linux、#/redis、#/git），
 * 不再用模块级可变状态，切模块即切换路由，可回退/前进。
 */
export function useModule() {
  const route = useRoute()
  const router = useRouter()

  const currentModule = computed(() => {
    const id = route.params.module
    return id && MODULES[id] ? MODULES[id] : null
  })

  // 收藏/最近查看页无模块概念，返回当前模块 id（用于定位回到哪个模块）
  const currentModuleId = computed(() => route.params.module || null)

  const moduleList = computed(() =>
    Object.values(MODULES).map((m) => ({ id: m.id, name: m.name, icon: m.icon }))
  )

  function switchModule(id) {
    if (route.params.module !== id) router.push(`/${id}`)
  }

  return { currentModule, currentModuleId, moduleList, switchModule }
}