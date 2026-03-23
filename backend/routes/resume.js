import { join } from "node:path"
import { readJsonFile, writeJsonFile } from "../utils/json-file.js"

export function registerResumeRoutes(app, options) {
  const dataFile = join(options.dataDir, "resume_local.json")

  app.get("/myInfo/resume", (req, res) => {
    console.log("GET /myInfo/resume - 获取简历数据")
    try {
      const data = readJsonFile(dataFile, null)
      res.json({
        code: 0,
        data,
        message: "获取成功"
      })
    } catch (error) {
      console.error("获取简历数据失败:", error)
      res.status(500).json({
        code: 500,
        data: null,
        message: "获取失败"
      })
    }
  })

  app.post("/myInfo/resume", (req, res) => {
    console.log("POST /myInfo/resume - 保存简历数据")
    console.log("接收到的数据:", JSON.stringify(req.body, null, 2))

    try {
      const resumeData = req.body
      if (!resumeData) {
        res.status(400).json({
          code: 400,
          data: null,
          message: "请求数据不能为空"
        })
        return
      }

      const success = writeJsonFile(dataFile, resumeData)

      if (success) {
        res.json({
          code: 0,
          data: resumeData,
          message: "保存成功"
        })
      } else {
        res.status(500).json({
          code: 500,
          data: null,
          message: "保存失败"
        })
      }
    } catch (error) {
      console.error("保存简历数据失败:", error)
      res.status(500).json({
        code: 500,
        data: null,
        message: "保存失败"
      })
    }
  })
}
