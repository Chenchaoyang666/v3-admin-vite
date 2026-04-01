import { existsSync, mkdirSync } from "node:fs"
import { createServer } from "node:net"
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
const DEFAULT_PORT = Number(process.env.PORT || 3001)
const HOST = process.env.HOST || "127.0.0.1"
const AUTO_SWITCH_PORT = process.env.AUTO_SWITCH_PORT !== "false"

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

let isShuttingDown = false
let server = null

startServer()

// 优雅关闭

// # 先查找进程 PID
// lsof -ti:3001

// # 发送 SIGTERM 信号
// kill PID

function shutdown(signal) {
  if (isShuttingDown) return
  isShuttingDown = true
  console.log(`收到 ${signal} 信号，正在关闭服务器...`)
  if (!server) {
    process.exit(0)
    return
  }

  server.close((error) => {
    if (error) {
      console.error("关闭服务器时发生错误:", error)
      process.exit(1)
      return
    }
    process.exit(0)
  })
}

// pnpm run backend
// # 然后按 Ctrl+C
process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))

async function startServer() {
  try {
    const port = AUTO_SWITCH_PORT
      ? await resolveAvailablePort(DEFAULT_PORT, HOST)
      : DEFAULT_PORT

    if (port !== DEFAULT_PORT) {
      console.warn(`端口 ${DEFAULT_PORT} 不可用，已自动切换到 ${port}`)
    }

    server = app.listen(port, HOST, () => {
      console.log("=========================================")
      console.log("myInfo 后端服务已启动")
      console.log(`地址: http://${HOST}:${port}`)
      console.log(`健康检查: http://${HOST}:${port}/health`)
      console.log(`API 健康检查: http://${HOST}:${port}/api/health`)
      console.log(`数据目录: ${DATA_DIR}`)
      console.log(`静态资源目录: ${DIST_DIR}`)
      console.log(`自动切换端口: ${AUTO_SWITCH_PORT ? "开启" : "关闭"}`)
      console.log("=========================================")
    })

    server.on("error", (error) => {
      console.error("后端服务启动失败:", formatListenError(error, port))
      process.exit(1)
    })
  } catch (error) {
    console.error("后端服务启动失败:", formatListenError(error, DEFAULT_PORT))
    process.exit(1)
  }
}

async function resolveAvailablePort(startPort, host) {
  let port = startPort
  const maxAttempts = 10

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const available = await canListen(port, host)
    if (available) return port
    port += 1
  }

  throw new Error(`从端口 ${startPort} 开始连续尝试 ${maxAttempts} 个端口后，仍未找到可用端口`)
}

function canListen(port, host) {
  return new Promise((resolve) => {
    const probe = createServer()

    probe.once("error", () => {
      probe.close()
      resolve(false)
    })

    probe.once("listening", () => {
      probe.close(() => resolve(true))
    })

    probe.listen(port, host)
  })
}

function formatListenError(error, port) {
  if (!error || typeof error !== "object") return error

  const code = "code" in error ? error.code : ""
  if (code === "EADDRINUSE") {
    return `端口 ${port} 已被占用，请关闭占用进程或改用其他端口，例如: PORT=${port + 1} pnpm run backend`
  }

  if (code === "EPERM") {
    return `没有权限监听 ${HOST}:${port}。可以尝试执行: PORT=${port + 1} pnpm run backend`
  }

  return error
}
