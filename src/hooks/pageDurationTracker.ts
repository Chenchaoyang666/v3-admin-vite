import { reportPageDurationApi } from "@/common/apis/pageStats"

// mousemove 仅 PC 有效；touchstart/touchmove/scroll 覆盖移动端触摸操作
const USER_EVENTS = ["keydown", "click", "scroll", "touchstart", "touchmove"] as const

const IDLE_TIMEOUT = 30_000

/** 需要监听的页面路径集合，为空表示监听所有页面 */
let watchedPages: Set<string> = new Set()

let currentPage = ""
let totalDuration = 0
let segmentStart: number | null = null
let startTime = ""
let idleTimer: ReturnType<typeof setTimeout> | null = null
let isIdle = false

function isWatched(page: string) {
  return watchedPages.size === 0 || watchedPages.has(page)
}

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
  }, IDLE_TIMEOUT)
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

// ── 上报当前页面并重置状态 ───────────────────────

function reportCurrent() {
  if (!currentPage) return
  endSegment()
  const seconds = Math.round(totalDuration / 1000)
  if (seconds > 0) {
    reportPageDurationApi({
      page: currentPage,
      duration: seconds,
      startTime,
      endTime: new Date().toISOString()
    })
  }
  // 重置状态，为下一个页面做准备
  currentPage = ""
  totalDuration = 0
  segmentStart = null
  startTime = ""
}

// ── 公开 API ─────────────────────────────────────

/** 设置需要监听的页面路径列表，不调用则监听所有页面 */
export function setWatchedPages(pages: string[]) {
  watchedPages = new Set(pages)
}

/** 切换到新页面：上报上一页，开始新页面计时（仅监听页面参与计时） */
export function switchPage(page: string) {
  reportCurrent()
  if (!isWatched(page)) {
    currentPage = ""
    return
  }
  currentPage = page
  startTime = new Date().toISOString()
  startSegment()
}

/** 页面进入后台/失焦：暂停计时 */
export function pauseTracking() {
  endSegment()
}

/** 页面回到前台/聚焦：恢复计时 */
export function resumeTracking() {
  if (currentPage) startSegment()
}

/** 初始化全局用户活动监听（在 App.vue 中调用一次） */
export function initActivityListeners() {
  USER_EVENTS.forEach(evt => window.addEventListener(evt, onUserActivity, { passive: true }))
}

/** 移除全局用户活动监听 */
export function destroyActivityListeners() {
  USER_EVENTS.forEach(evt => window.removeEventListener(evt, onUserActivity))
}
