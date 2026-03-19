import { onMounted, onBeforeUnmount } from "vue"
import { reportPageDurationApi } from "@/common/apis/pageStats"

interface UsePageDurationOptions {
  /** 页面标识（路由 path 或自定义名称） */
  page: string
  /** 无操作多少毫秒视为空闲，默认 30000（30s） */
  idleTimeout?: number
}

// mousemove 仅 PC 有效；touchstart/touchmove/scroll 覆盖移动端触摸操作
const USER_EVENTS = ["keydown", "click", "scroll", "touchstart", "touchmove"] as const

export function usePageDuration(options: UsePageDurationOptions) {
  const { page, idleTimeout = 30_000 } = options

  /** 累计有效时长（ms） */
  let totalDuration = 0
  /** 当前计时段开始时间戳，null 表示未在计时 */
  let segmentStart: number | null = null
  /** 首次开始的 ISO 时间戳 */
  let startTime = ""
  /** 空闲倒计时句柄 */
  let idleTimer: ReturnType<typeof setTimeout> | null = null
  /** 是否处于空闲状态 */
  let isIdle = false
  /** 防止重复上报（仅在组件真正卸载后锁定） */
  let reported = false

  // ── 计时段管理 ──────────────────────────────────

  function startSegment() {
    if (segmentStart !== null) return
    isIdle = false
    segmentStart = Date.now()
    resetIdleTimer()
  }

  function endSegment() {
    if (segmentStart === null) return
    totalDuration += Date.now() - segmentStart
    segmentStart = null
    clearIdleTimer()
  }

  function resetIdleTimer() {
    clearIdleTimer()
    idleTimer = setTimeout(() => {
      isIdle = true
      endSegment()
    }, idleTimeout)
  }

  function clearIdleTimer() {
    if (idleTimer !== null) {
      clearTimeout(idleTimer)
      idleTimer = null
    }
  }

  // ── 用户操作：重置空闲倒计时 ────────────────────

  function onUserActivity() {
    if (isIdle) {
      startSegment()
    } else {
      resetIdleTimer()
    }
  }

  function addActivityListeners() {
    USER_EVENTS.forEach(evt => window.addEventListener(evt, onUserActivity, { passive: true }))
  }

  function removeActivityListeners() {
    USER_EVENTS.forEach(evt => window.removeEventListener(evt, onUserActivity))
  }

  // ── 页面可见性 / 窗口焦点 ───────────────────────
  // 注意：blur/visibilitychange hidden 只暂停计时（不上报），
  // 用户切回后可继续累计。最终上报仅在 onBeforeUnmount 中发生。

  function onVisibilityChange() {
    if (document.visibilityState === "hidden") {
      endSegment()
    } else {
      startSegment()
    }
  }

  function onWindowBlur() {
    endSegment()
  }

  function onWindowFocus() {
    if (document.visibilityState === "visible") {
      startSegment()
    }
  }

  // ── 最终上报（仅在组件卸载时触发） ──────────────

  function report() {
    if (reported) return
    reported = true
    endSegment()
    const seconds = Math.round(totalDuration / 1000)
    if (seconds <= 0) return
    reportPageDurationApi({
      page,
      duration: seconds,
      startTime,
      endTime: new Date().toISOString()
    })
  }

  // ── 生命周期 ────────────────────────────────────

  onMounted(() => {
    startTime = new Date().toISOString()
    startSegment()
    addActivityListeners()
    document.addEventListener("visibilitychange", onVisibilityChange)
    // pagehide 兜底：iOS Safari 切换 App/标签页时 visibilitychange 不可靠
    window.addEventListener("pagehide", onWindowBlur)
    window.addEventListener("blur", onWindowBlur)
    window.addEventListener("focus", onWindowFocus)
  })

  onBeforeUnmount(() => {
    report()
    removeActivityListeners()
    document.removeEventListener("visibilitychange", onVisibilityChange)
    window.removeEventListener("pagehide", onWindowBlur)
    window.removeEventListener("blur", onWindowBlur)
    window.removeEventListener("focus", onWindowFocus)
  })

  return {
    /** 获取当前累计有效停留秒数（含正在计时的段） */
    getDuration: () => Math.round((totalDuration + (segmentStart ? Date.now() - segmentStart : 0)) / 1000)
  }
}
