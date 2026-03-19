import express from "express"
import cors from "cors"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { readFileSync, writeFileSync, existsSync } from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 创建 Express 应用
const app = express()
const PORT = 3001

// 中间件
app.use(cors())
// 增加请求体大小限制，避免大文件上传时出错
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// 数据文件路径
const DATA_FILE = join(__dirname, "data", "resume_local.json")

// 确保数据目录存在
const DATA_DIR = join(__dirname, "data")
if (!existsSync(DATA_DIR)) {
  const fs = await import("fs")
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// 默认简历数据
const DEFAULT_RESUME = {
  name: "张三",
  title: "前端开发工程师",
  avatar: "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png",
  phone: "13800138000",
  email: "zhangsan@example.com",
  location: "北京市",
  summary: "热爱前端开发，拥有丰富的项目经验，专注于用户体验和代码质量。善于学习新技术，具有良好的团队协作能力。",
  workExperience: [
    {
      company: "某某科技有限公司",
      position: "前端开发工程师",
      startDate: "2020-06",
      endDate: "",
      description: "负责公司核心产品的前端开发，使用 Vue3 + TypeScript 构建高质量的前端应用。",
    },
  ],
  education: [
    {
      school: "某某大学",
      major: "计算机科学与技术",
      degree: "本科",
      graduationYear: "2020",
    },
  ],
  skills: ["Vue3", "TypeScript", "JavaScript", "Element Plus", "Vite", "CSS3"],
  projects: [
    {
      name: "某管理系统",
      period: "2020-2023",
      description: "为企业打造的一站式管理平台，提升办公效率。",
      techStack: "Vue3, TypeScript, Element Plus, Vite",
    },
  ],
}

// 读取简历数据
function readResumeData() {
  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, "utf-8")
      return JSON.parse(data)
    }
  } catch (error) {
    console.error("读取简历数据失败:", error)
  }
  return null
}

// 保存简历数据
function saveResumeData(data) {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8")
    return true
  } catch (error) {
    console.error("保存简历数据失败:", error)
    return false
  }
}

// 获取简历数据
app.get("/myInfo/resume", (req, res) => {
  console.log("GET /myInfo/resume - 获取简历数据")
  try {
    const data = readResumeData()
    res.json({
      code: 0,
      data: data,
      message: "获取成功",
    })
  } catch (error) {
    console.error("获取简历数据失败:", error)
    res.status(500).json({
      code: 500,
      data: null,
      message: "获取失败",
    })
  }
})

// 保存简历数据
app.post("/myInfo/resume", (req, res) => {
  console.log("POST /myInfo/resume - 保存简历数据")
  console.log("接收到的数据:", JSON.stringify(req.body, null, 2))

  try {
    const resumeData = req.body
    if (!resumeData) {
      res.status(400).json({
        code: 400,
        data: null,
        message: "请求数据不能为空",
      })
      return
    }

    // 保存数据
    const success = saveResumeData(resumeData)

    if (success) {
      res.json({
        code: 0,
        data: resumeData,
        message: "保存成功",
      })
    } else {
      res.status(500).json({
        code: 500,
        data: null,
        message: "保存失败",
      })
    }
  } catch (error) {
    console.error("保存简历数据失败:", error)
    res.status(500).json({
      code: 500,
      data: null,
      message: "保存失败",
    })
  }
})

// 页面停留时长数据文件路径
const PAGE_STATS_FILE = join(__dirname, "data", "page_stats.json")

// 读取停留时长记录
function readPageStats() {
  try {
    if (existsSync(PAGE_STATS_FILE)) {
      const data = readFileSync(PAGE_STATS_FILE, "utf-8")
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.error("读取页面统计数据失败:", error)
  }
  return []
}

// 上报页面停留时长
app.post("/page-stats/duration", (req, res) => {
  console.log("POST /page-stats/duration - 上报页面停留时长")
  const { page, duration, startTime, endTime } = req.body

  if (!page || duration === undefined) {
    res.status(400).json({ code: 400, data: null, message: "page 和 duration 为必填项" })
    return
  }

  try {
    const records = readPageStats()
    const record = { page, duration, startTime, endTime, createdAt: new Date().toISOString() }
    records.push(record)
    writeFileSync(PAGE_STATS_FILE, JSON.stringify(records, null, 2), "utf-8")
    console.log(`页面 ${page} 停留时长: ${duration}s`)
    res.json({ code: 0, data: record, message: "上报成功" })
  } catch (error) {
    console.error("上报页面停留时长失败:", error)
    res.status(500).json({ code: 500, data: null, message: "上报失败" })
  }
})

// 查询页面停留时长记录
app.get("/page-stats/duration", (req, res) => {
  console.log("GET /page-stats/duration - 查询页面停留时长记录")
  try {
    const records = readPageStats()
    res.json({ code: 0, data: records, message: "获取成功" })
  } catch (error) {
    console.error("查询页面统计数据失败:", error)
    res.status(500).json({ code: 500, data: null, message: "获取失败" })
  }
})

// 健康检查
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "myInfo backend is running" })
})

// 启动服务器
app.listen(PORT, () => {
  console.log("=========================================")
  console.log(`myInfo 后端服务已启动`)
  console.log(`端口: ${PORT}`)
  console.log(`健康检查: http://localhost:${PORT}/health`)
  console.log(`数据存储: ${DATA_FILE}`)
  console.log("=========================================")
})

// 优雅关闭

// # 先查找进程 PID
// lsof -ti:3001

// # 发送 SIGTERM 信号
// kill PID

process.on("SIGTERM", () => {
  console.log("收到 SIGTERM 信号，正在关闭服务器...")
  process.exit(0)
})

// node backend/myInfo-server.js
// # 然后按 Ctrl+C

process.on("SIGINT", () => {
  console.log("收到 SIGINT 信号，正在关闭服务器...")
  process.exit(0)
})
