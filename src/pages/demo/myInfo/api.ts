import type * as Types from "./types"
import { request } from "@/http/axios"

/** 获取个人简历数据 */
export function getResumeApi() {
  return request<Types.ResumeResponse>({
    baseURL: "/api",
    url: "/myInfo/resume",
    method: "get"
  })
}

/** 保存个人简历数据 */
export function saveResumeApi(data: Types.ResumeData) {
  return request<Types.SaveResumeResponse>({
    baseURL: "/api",
    url: "/myInfo/resume",
    method: "post",
    data
  })
}
