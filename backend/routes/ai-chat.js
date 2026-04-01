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

function buildAssistantReply(userMessage) {
  return [
    "# 富内容流式回复 Demo",
    "",
    `已收到你的问题：**${userMessage}**。`,
    "",
    "这是一个用于演示前端流式输出的本地接口，它会像真实大模型那样逐段返回内容，并且现在支持更完整的 Markdown、真正的 ECharts 渲染，以及可分页的 VXETable 表格块。",
    "",
    "## 当前支持的内容",
    "",
    "- 标题、段落、引用、列表",
    "- 表格对齐、任务列表、分割线、代码块",
    "- 图片",
    "- 使用完整 ECharts option 的 `echarts` 图表代码块",
    "- 使用结构化 JSON 配置的 `vxetable` 分页表格代码块",
    "",
    "## 关键观察点",
    "",
    "1. 用户消息会先立即出现在界面中。",
    "2. 助手回复通过 SSE 按小片段持续推送。",
    "3. 当前轮问答完成后，用户和助手消息都会落盘到 `backend/data/ai_chat_messages.json`。",
    "",
    // recentSummary
    //   ? `> 最近几条上下文如下：\n> ${recentSummary.replaceAll("\n", "\n> ")}`
    //   : "> 当前还没有更多历史上下文，这是第一次演示消息。",
    "",
    "## 示例表格",
    "",
    "| 能力 | 当前状态 | 说明 |",
    "| --- | --- | --- |",
    "| Markdown | 已支持 | 包含标题、列表、引用和代码块 |",
    "| 表格 | 已支持 | 会自动横向滚动 |",
    "| 图片 | 已支持 | 支持标准 `![alt](url)` 语法 |",
    "| 图表 | 已支持 | 使用完整 `echarts` option 渲染 |",
    "| 分页表格 | 已支持 | 使用 `vxetable` JSON 配置并支持本地分页 |",
    "",
    "## 示例任务列表",
    "",
    "- [x] 支持流式增量输出",
    "- [x] 支持 Markdown 表格",
    "- [x] 支持图片、真实图表与分页表格",
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
    "## 示例分页表格",
    "",
    "```vxetable",
    JSON.stringify({
      title: "近 12 条商品趋势明细",
      columns: [
        { field: "date", title: "日期", minWidth: 120 },
        { field: "channel", title: "渠道", minWidth: 120 },
        { field: "orders", title: "订单数", minWidth: 100, align: "center" },
        { field: "gmv", title: "成交额", minWidth: 120, align: "right" },
        { field: "rate", title: "转化率", minWidth: 100, align: "center" }
      ],
      data: [
        { date: "2026-03-20", channel: "App", orders: 126, gmv: "18,240", rate: "12.3%" },
        { date: "2026-03-21", channel: "Web", orders: 98, gmv: "15,180", rate: "10.8%" },
        { date: "2026-03-22", channel: "Mini Program", orders: 143, gmv: "22,460", rate: "14.2%" },
        { date: "2026-03-23", channel: "App", orders: 154, gmv: "24,810", rate: "15.1%" },
        { date: "2026-03-24", channel: "Web", orders: 112, gmv: "16,920", rate: "11.4%" },
        { date: "2026-03-25", channel: "Mini Program", orders: 168, gmv: "27,300", rate: "16.2%" },
        { date: "2026-03-26", channel: "App", orders: 175, gmv: "29,640", rate: "16.8%" },
        { date: "2026-03-27", channel: "Web", orders: 121, gmv: "18,770", rate: "12.1%" },
        { date: "2026-03-28", channel: "Mini Program", orders: 182, gmv: "30,950", rate: "17.4%" },
        { date: "2026-03-29", channel: "App", orders: 191, gmv: "32,180", rate: "17.9%" },
        { date: "2026-03-30", channel: "Web", orders: 134, gmv: "20,360", rate: "12.9%" },
        { date: "2026-03-31", channel: "Mini Program", orders: 205, gmv: "34,420", rate: "18.6%" }
      ],
      pagination: {
        pageSize: 5,
        pageSizes: [5, 10, 20]
      }
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
    const assistantText = buildAssistantReply(userText)
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

  app.post("/ai-chat/reply", async (req, res) => {
    const userText = `${req.body?.message || ""}`.trim()

    if (!userText) {
      res.status(400).json({ code: 400, data: null, message: "message 不能为空" })
      return
    }

    try {
      const messages = readAiChatMessages(aiChatFile)
      const userMessage = createMessage("user", userText)
      const assistantText = buildAssistantReply(userText)
      const assistantMessage = createMessage("assistant", assistantText)
      const nextMessages = [...messages, userMessage, assistantMessage]
      const success = saveAiChatMessages(aiChatFile, nextMessages)

      if (!success) {
        res.status(500).json({ code: 500, data: null, message: "消息落盘失败" })
        return
      }

      res.json({
        code: 0,
        data: {
          content: assistantText,
          message: assistantMessage
        },
        message: "获取成功"
      })
    } catch (error) {
      console.error("非流式回复失败:", error)
      res.status(500).json({ code: 500, data: null, message: "获取失败" })
    }
  })
}
