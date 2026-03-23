import { join } from "node:path"
import { readJsonFile, writeJsonFile } from "../utils/json-file.js"

function readAiChatMessages(filePath) {
  const data = readJsonFile(filePath, [])
  return Array.isArray(data) ? data : []
}

function saveAiChatMessages(filePath, messages) {
  return writeJsonFile(filePath, messages)
}

function createMessage(role, content) {
  return {
    id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString()
  }
}

function buildAssistantReply(userMessage, history) {
  const recentSummary = history
    .slice(-4)
    .map((item, index) => `${index + 1}. [${item.role}] ${item.content}`)
    .join("\n")

  return [
    "# 富内容流式回复 Demo",
    "",
    `已收到你的问题：**${userMessage}**。`,
    "",
    "这是一个用于演示前端流式输出的本地接口，它会像真实大模型那样逐段返回内容，并且现在支持更完整的 Markdown 和真正的 ECharts 渲染。",
    "",
    "## 当前支持的内容",
    "",
    "- 标题、段落、引用、列表",
    "- 表格对齐、任务列表、分割线、代码块",
    "- 图片",
    "- 使用完整 ECharts option 的 `echarts` 图表代码块",
    "",
    "## 关键观察点",
    "",
    "1. 用户消息会先立即出现在界面中。",
    "2. 助手回复通过 SSE 按小片段持续推送。",
    "3. 当前轮问答完成后，用户和助手消息都会落盘到 `backend/data/ai_chat_messages.json`。",
    "",
    recentSummary
      ? `> 最近几条上下文如下：\n> ${recentSummary.replaceAll("\n", "\n> ")}`
      : "> 当前还没有更多历史上下文，这是第一次演示消息。",
    "",
    "## 示例表格",
    "",
    "| 能力 | 当前状态 | 说明 |",
    "| --- | --- | --- |",
    "| Markdown | 已支持 | 包含标题、列表、引用和代码块 |",
    "| 表格 | 已支持 | 会自动横向滚动 |",
    "| 图片 | 已支持 | 支持标准 `![alt](url)` 语法 |",
    "| 图表 | 已支持 | 使用完整 `echarts` option 渲染 |",
    "",
    "## 示例任务列表",
    "",
    "- [x] 支持流式增量输出",
    "- [x] 支持 Markdown 表格",
    "- [x] 支持图片与真实图表",
    "- [ ] 可继续接入真实大模型流",
    "",
    "---",
    "",
    "## 示例图片",
    "",
    "![Demo Preview](https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg)",
    "",
    "## 示例图表",
    "",
    "```echarts",
    JSON.stringify({
      title: {
        text: "最近 5 天演示数据",
        left: "center"
      },
      tooltip: {
        trigger: "axis"
      },
      legend: {
        top: 28,
        data: ["提问数", "满意度"]
      },
      grid: {
        left: 36,
        right: 24,
        top: 80,
        bottom: 36
      },
      xAxis: {
        type: "category",
        data: ["Mon", "Tue", "Wed", "Thu", "Fri"]
      },
      yAxis: [
        {
          type: "value",
          name: "提问数"
        },
        {
          type: "value",
          name: "满意度",
          min: 0,
          max: 100
        }
      ],
      series: [
        {
          name: "提问数",
          type: "bar",
          data: [12, 18, 14, 22, 19],
          itemStyle: { color: "#bf5a36" },
          barMaxWidth: 32
        },
        {
          name: "满意度",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          data: [68, 74, 71, 86, 82],
          itemStyle: { color: "#2a6785" },
          lineStyle: { width: 3 }
        }
      ]
    }, null, 2),
    "```",
    "",
    "如果你愿意，我们还可以把这个 demo 再接成真实模型接口。"
  ].join("\n")
}

export function registerAiChatRoutes(app, options) {
  const aiChatFile = join(options.dataDir, "ai_chat_messages.json")

  app.get("/ai-chat/messages", (req, res) => {
    try {
      const messages = readAiChatMessages(aiChatFile)
      res.json({ code: 0, data: messages, message: "获取成功" })
    } catch (error) {
      console.error("获取聊天记录失败:", error)
      res.status(500).json({ code: 500, data: [], message: "获取失败" })
    }
  })

  app.delete("/ai-chat/messages", (req, res) => {
    try {
      const success = saveAiChatMessages(aiChatFile, [])
      if (!success) {
        res.status(500).json({ code: 500, data: [], message: "清空失败" })
        return
      }
      res.json({ code: 0, data: [], message: "清空成功" })
    } catch (error) {
      console.error("清空聊天记录失败:", error)
      res.status(500).json({ code: 500, data: [], message: "清空失败" })
    }
  })

  app.post("/ai-chat/stream", async (req, res) => {
    const userText = `${req.body?.message || ""}`.trim()

    if (!userText) {
      res.status(400).json({ code: 400, data: null, message: "message 不能为空" })
      return
    }

    const messages = readAiChatMessages(aiChatFile)
    const userMessage = createMessage("user", userText)
    const assistantText = buildAssistantReply(userText, messages)
    const assistantMessage = createMessage("assistant", assistantText)
    const chunks = assistantText.match(/.{1,12}/gs) || [assistantText]

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders?.()

    const sendEvent = (payload) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`)
    }

    try {
      for (const chunk of chunks) {
        sendEvent({ type: "delta", content: chunk })
        await new Promise(resolve => setTimeout(resolve, 70))
      }

      const nextMessages = [...messages, userMessage, assistantMessage]
      const success = saveAiChatMessages(aiChatFile, nextMessages)

      if (!success) {
        sendEvent({ type: "error", error: "消息落盘失败" })
        res.end()
        return
      }

      sendEvent({ type: "done", message: assistantMessage })
      res.end()
    } catch (error) {
      console.error("流式输出失败:", error)
      sendEvent({ type: "error", error: "流式输出失败" })
      res.end()
    }
  })
}
