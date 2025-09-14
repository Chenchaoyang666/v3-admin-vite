<template>
  <div class="container">
    <div class="header">
      <h2>AI 问答演示</h2>
    </div>
    <div class="content">
      <div class="messages">
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="['chat-message', msg.sender === '用户' ? 'from-user' : 'from-ai']"
        >
          <div class="message-sender">{{ msg.sender }}</div>
          <div class="message-content">{{ msg.content }}</div>
        </div>
      </div>
    </div>
    <div class="footer">
      <form class="chat-input" @submit.prevent="sendMessage">
        <input
          v-model="input"
          @keyup.enter.exact.prevent="sendMessage"
          placeholder="请输入你的问题..."
          class="input-field"
        />
        <button type="submit" class="send-button">发送</button>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

interface Message {
  content: string;
  sender: string;
}

const messages = ref<Message[]>([]);
const input = ref('');

const sendMessageToAI = async (message: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`AI回复：你说的是 "${message}"`);
    }, 800);
  });
};

const sendMessage = async () => {
  if (!input.value.trim()) return;
  messages.value.push({ content: input.value, sender: '用户' });
  const aiReply = await sendMessageToAI(input.value);
  messages.value.push({ content: aiReply, sender: 'AI' });
  input.value = '';
};
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 85vh;
  background: #f4f6fa;
}

.header {
  flex: 0 0 auto;
  background: #222;
  color: #fff;
  padding: 1rem;
  text-align: center;
  letter-spacing: 2px;
}

.content {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chat-message {
  margin: 0;
  padding: 10px;
  border-radius: 5px;
  max-width: 80%;
  word-break: break-all;
}

.from-user {
  background-color: #d1e7dd;
  align-self: flex-end;
  text-align: right;
}

.from-ai {
  background-color: #f8d7da;
  align-self: flex-start;
  text-align: left;
}

.message-sender {
  font-weight: bold;
}

.message-content {
  margin-top: 5px;
}

.footer {
  flex: 0 0 auto;
  background: #fff;
  padding: 0.75rem 1rem;
  box-shadow: 0 -2px 8px #0001;
  display: flex;
  align-items: flex-end;
}

.chat-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.input-field {
  flex: 1;
  min-width: 0;
  padding: 0.75em 1em;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.send-button {
  padding: 0.75em 1.2em;
  font-size: 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}

.send-button:hover {
  background-color: #0056b3;
}

@media (max-width: 600px) {
  .container {
    font-size: 0.95rem;
  }
  .content {
    padding: 0.5rem;
  }
  .footer {
    padding: 0.5rem;
  }
  .chat-input {
    gap: 0.25rem;
  }
  .input-field, .send-button {
    font-size: 1em;
    padding: 0.5em 0.7em;
  }
}
</style>