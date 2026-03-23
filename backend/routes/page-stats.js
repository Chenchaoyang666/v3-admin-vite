import { join } from "node:path"
import { readJsonFile, writeJsonFile } from "../utils/json-file.js"

export function registerPageStatsRoutes(app, options) {
  const dataFile = join(options.dataDir, "page_stats.json")

  app.post("/page-stats/duration", (req, res) => {
    console.log("POST /page-stats/duration - 上报页面停留时长")
    const { page, duration, startTime, endTime } = req.body

    if (!page || duration === undefined) {
      res.status(400).json({ code: 400, data: null, message: "page 和 duration 为必填项" })
      return
    }

    try {
      const records = readJsonFile(dataFile, [])
      const normalizedRecords = Array.isArray(records) ? records : []
      const record = { page, duration, startTime, endTime, createdAt: new Date().toISOString() }
      normalizedRecords.push(record)
      writeJsonFile(dataFile, normalizedRecords)
      console.log(`页面 ${page} 停留时长: ${duration}s`)
      res.json({ code: 0, data: record, message: "上报成功" })
    } catch (error) {
      console.error("上报页面停留时长失败:", error)
      res.status(500).json({ code: 500, data: null, message: "上报失败" })
    }
  })

  app.get("/page-stats/duration", (req, res) => {
    console.log("GET /page-stats/duration - 查询页面停留时长记录")
    try {
      const records = readJsonFile(dataFile, [])
      res.json({ code: 0, data: Array.isArray(records) ? records : [], message: "获取成功" })
    } catch (error) {
      console.error("查询页面统计数据失败:", error)
      res.status(500).json({ code: 500, data: null, message: "获取失败" })
    }
  })
}
