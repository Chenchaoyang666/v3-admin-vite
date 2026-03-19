import { request } from "@/http/axios"

interface PageDurationPayload {
  /** 页面标识（路由 path 或自定义名称） */
  page: string
  /** 有效停留秒数（整数） */
  duration: number
  /** 开始计时的 ISO 时间戳 */
  startTime: string
  /** 停止计时的 ISO 时间戳 */
  endTime: string
}

/** 上报页面停留时长 */
export function reportPageDurationApi(data: PageDurationPayload) {
  return request({
    baseURL: "/api",
    url: "/page-stats/duration",
    method: "post",
    data
  })
}
