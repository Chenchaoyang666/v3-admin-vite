<script lang="ts" setup>
import { useGreyAndColorWeakness } from "@@/composables/useGreyAndColorWeakness"
import { usePany } from "@@/composables/usePany"
import { useTheme } from "@@/composables/useTheme"
import { initActivityListeners, destroyActivityListeners, pauseTracking, resumeTracking, setWatchedPages } from "@/hooks/pageDurationTracker"
import zhCn from "element-plus/es/locale/lang/zh-cn" // Element Plus 中文包

const { initTheme } = useTheme()

const { initGreyAndColorWeakness } = useGreyAndColorWeakness()

const { initStarNotification, initStoreNotification, initMobileNotification } = usePany()

// 初始化主题
initTheme()

// 初始化灰色模式和色弱模式
initGreyAndColorWeakness()

// #region 初始化通知
initStarNotification()

initStoreNotification()

initMobileNotification()
// #endregion

// 初始化页面停留时长统计
// 配置需要监听的页面路径，不调用 setWatchedPages 则监听所有页面
setWatchedPages(["/demo/myInfo"])
initActivityListeners()
const onVisibilityChange = () => {
  document.visibilityState === "hidden" ? pauseTracking() : resumeTracking()
}
document.addEventListener("visibilitychange", onVisibilityChange)
window.addEventListener("pagehide", pauseTracking)
window.addEventListener("blur", pauseTracking)
window.addEventListener("focus", resumeTracking)

onBeforeUnmount(() => {
  destroyActivityListeners()
  document.removeEventListener("visibilitychange", onVisibilityChange)
  window.removeEventListener("pagehide", pauseTracking)
  window.removeEventListener("blur", pauseTracking)
  window.removeEventListener("focus", resumeTracking)
})
</script>

<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>
