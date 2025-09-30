// server/index.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.OPENAI_API_KEY; // 在 .env 里设置

app.post("/api/chat", async (req, res) => {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        ...req.body,
        stream: true // ✅ 开启流式输出
      })
    });

    // 告诉前端用 EventStream
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    response.body.on("data", (chunk) => {
      res.write(chunk.toString());
    });

    response.body.on("end", () => {
      res.end();
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("代理服务已启动: http://localhost:3000");
});
