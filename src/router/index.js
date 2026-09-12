import { createRouter, createWebHashHistory } from 'vue-router'
import Browser from '../components/Browser.vue'
import { MODULES } from '../data/modules.js'

const moduleIds = Object.keys(MODULES)

// hash 路由：任意静态托管（Gitee Pages / GitHub Pages / 本地双击）零配置可用
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: `/${moduleIds[0]}` },
    { path: '/favorites', component: Browser, props: { mode: 'favorites' } },
    { path: '/recent', component: Browser, props: { mode: 'recent' } },
    {
      path: '/:module',
      component: Browser,
      props: true,
      beforeEnter: (to) => {
        if (!moduleIds.includes(to.params.module)) return `/${moduleIds[0]}`
        return true
      },
    },
  ],
})