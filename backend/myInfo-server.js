import { existsSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import cors from "cors"
import express from "express"
import { registerAiChatRoutes } from "./routes/ai-chat.js"
import { registerPageStatsRoutes } from "./routes/page-stats.js"
import { registerResumeRoutes } from "./routes/resume.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 创建 Express 应用
const app = express()
const PORT = Number(process.env.PORT || 3001)

// 中间件
app.use(cors())
// 增加请求体大小限制，避免大文件上传时出错
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// 确保数据目录存在
const DATA_DIR = process.env.DATA_DIR
  ? resolve(process.env.DATA_DIR)
  : join(__dirname, "data")
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

const apiRouter = express.Router()

registerAiChatRoutes(apiRouter, { dataDir: DATA_DIR })
registerResumeRoutes(apiRouter, { dataDir: DATA_DIR })
registerPageStatsRoutes(apiRouter, { dataDir: DATA_DIR })

app.use("/api", apiRouter)

// 健康检查
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "myInfo backend is running" })
})

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "myInfo backend is running" })
})

const DIST_DIR = resolve(__dirname, "../dist")
const INDEX_FILE = join(DIST_DIR, "index.html")

if (existsSync(INDEX_FILE)) {
  app.use(express.static(DIST_DIR))

  app.get(/^\/(?!api(?:\/|$)|health$).*/, (req, res) => {
    res.sendFile(INDEX_FILE)
  })
}

// 启动服务器
app.listen(PORT, () => {
  console.log("=========================================")
  console.log(`myInfo 后端服务已启动`)
  console.log(`端口: ${PORT}`)
  console.log(`健康检查: http://localhost:${PORT}/health`)
  console.log(`API 健康检查: http://localhost:${PORT}/api/health`)
  console.log(`数据目录: ${DATA_DIR}`)
  console.log(`静态资源目录: ${DIST_DIR}`)
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
