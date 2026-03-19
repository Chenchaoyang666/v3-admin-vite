import type { Router } from "vue-router"
import { setRouteChange } from "@@/composables/useRouteListener"
import { switchPage } from "@/hooks/pageDurationTracker"
import { useTitle } from "@@/composables/useTitle"
import NProgress from "nprogress"
import { usePermissionStore } from "@/pinia/stores/permission"
import { useUserStore } from "@/pinia/stores/user"
import { routerConfig } from "@/router/config"

NProgress.configure({ showSpinner: false })

const { setTitle } = useTitle()

const LOGIN_PATH = "/login"

export function registerNavigationGuard(router: Router) {
  // 全局前置守卫
  router.beforeEach(async (to, _from) => {
    NProgress.start()
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()
    // 不需要登录：访问 Login 页面时直接重定向到主页
    if (to.path === LOGIN_PATH) return "/"
    // 如果用户已经获得其权限角色
    if (userStore.roles.length !== 0) return true
    // 否则要重新获取权限角色
    try {
      await userStore.getInfo()
      // 注意：角色必须是一个数组！ 例如: ["admin"] 或 ["developer", "editor"]
      const roles = userStore.roles
      // 生成可访问的 Routes
      routerConfig.dynamic ? permissionStore.setRoutes(roles) : permissionStore.setAllRoutes()
      // 将 "有访问权限的动态路由" 添加到 Router 中
      permissionStore.addRoutes.forEach(route => router.addRoute(route))
      // 设置 replace: true, 因此导航将不会留下历史记录
      return { ...to, replace: true }
    } catch (error) {
      // 不需要登录：发生错误时降级为加载全部路由，避免卡在登录流程
      ElMessage.error((error as Error).message || "路由守卫发生错误")
      permissionStore.setAllRoutes()
      permissionStore.addRoutes.forEach(route => router.addRoute(route))
      return { ...to, replace: true }
    }
  })

  // 全局后置钩子
  router.afterEach((to) => {
    setRouteChange(to)
    setTitle(to.meta.title)
    NProgress.done()
    switchPage(to.path)
  })
}
