<template>
  <div class="chat-container">
    <div class="messages">
      <div v-for="(msg, index) in messages" :key="index" class="message">
        <strong>{{ msg.role }}:</strong>
        <span>{{ msg.content }}</span>
      </div>
    </div>

    <div class="input-box">
      <input
        v-model="input"
        @keyup.enter="sendMessage"
        placeholder="请输入问题..."
      />
      <button @click="sendMessage">发送</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const messages = ref([
  { role: "assistant", content: "你好，我是 AI 助手，有什么可以帮你？" }
]);
const input = ref("");

const sendMessage = async () => {
  if (!input.value) return;

  // 添加用户消息
  messages.value.push({ role: "user", content: input.value });

  // 添加一个空的 AI 回复（流式填充）
  const aiMessage = { role: "assistant", content: "" };
  messages.value.push(aiMessage);

  const userInput = input.value;
  input.value = "";

  const response = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: userInput }]
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let partial = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter(line => line.trim() !== "");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.replace("data: ", "");
        if (data === "[DONE]") return;

        try {
          const json = JSON.parse(data);
          const token = json.choices[0]?.delta?.content || "";
          partial += token;
          aiMessage.content = partial; // 更新 AI 回复
        } catch (err) {
          console.error("解析错误:", err, line);
        }
      }
    }
  }
};
</script>

<style>
.chat-container {
  width: 600px;
  margin: auto;
  border: 1px solid #ccc;
  padding: 12px;
  border-radius: 8px;
}
.messages {
  height: 400px;
  overflow-y: auto;
  background: #fafafa;
  padding: 10px;
  margin-bottom: 10px;
}
.message {
  margin-bottom: 8px;
}
.input-box {
  display: flex;
  gap: 8px;
}
input {
  flex: 1;
  padding: 6px;
}
</style>
