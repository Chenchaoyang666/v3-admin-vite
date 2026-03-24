<script lang="ts" setup>
import type { AiChatMessage, AiChatStatItem } from "./types"
import { computed, nextTick, ref, watch } from "vue"
import { RichContentRenderer } from "../RichContentRenderer"

const props = withDefaults(defineProps<{
  draft: string
  messages: AiChatMessage[]
  pendingContent?: string
  stats?: AiChatStatItem[]
  quickPrompts?: string[]
  eyebrow?: string
  title?: string
  description?: string
  emptyTitle?: string
  emptyDescription?: string
  placeholder?: string
  refreshText?: string
  clearText?: string
  sendText?: string
  clearConfirmText?: string
  tipText?: string
  historyLoading?: boolean
  submitting?: boolean
  streaming?: boolean
  chartHeight?: number | string
  formatTime?: (value: string) => string
  collapsibleHero?: boolean
  defaultHeroCollapsed?: boolean
}>(), {
  pendingContent: "",
  stats: () => [],
  quickPrompts: () => [],
  eyebrow: "Streaming Demo",
  title: "AI Chat",
  description: "",
  emptyTitle: "开始一次流式问答",
  emptyDescription: "输入一段问题，页面会立即插入用户消息，并逐段展示助手回复。",
  placeholder: "输入一个问题",
  refreshText: "刷新记录",
  clearText: "清空记录",
  sendText: "发送问题",
  clearConfirmText: "将清空当前保存的全部对话记录，是否继续？",
  tipText: "按 Enter 发送，Shift + Enter 换行",
  historyLoading: false,
  submitting: false,
  streaming: false,
  chartHeight: 360,
  formatTime: (value: string) => value,
  collapsibleHero: true,
  defaultHeroCollapsed: true
})

const emit = defineEmits<{
  "update:draft": [value: string]
  "submit": []
  "refresh": []
  "clear": []
  "promptSelect": [prompt: string]
}>()

const AUTO_SCROLL_THRESHOLD = 80

const messageContainer = ref<HTMLElement | null>(null)
const shouldAutoScroll = ref(true)
const heroCollapsed = ref(props.defaultHeroCollapsed)

const draftValue = computed({
  get: () => props.draft,
  set: value => emit("update:draft", value)
})

function updateAutoScrollState() {
  const container = messageContainer.value
  if (!container) return
  const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight
  shouldAutoScroll.value = distanceToBottom <= AUTO_SCROLL_THRESHOLD
}

function handleMessageScroll() {
  updateAutoScrollState()
}

async function scrollToBottom(force = false) {
  await nextTick()
  const container = messageContainer.value
  if (!container) return
  if (!force && !shouldAutoScroll.value) return

  requestAnimationFrame(() => {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "auto"
    })
    shouldAutoScroll.value = true
  })
}

function handlePromptClick(prompt: string) {
  emit("update:draft", prompt)
  emit("promptSelect", prompt)
}

function handleSubmit() {
  shouldAutoScroll.value = true
  emit("submit")
}

function toggleHeroCollapsed() {
  heroCollapsed.value = !heroCollapsed.value
}

watch(
  () => [props.messages.length, props.pendingContent],
  async () => {
    if (!props.messages.length && !props.pendingContent) {
      await scrollToBottom(true)
      return
    }

    if (!props.streaming && !props.pendingContent) return
    await scrollToBottom()
  },
  { flush: "post" }
)

defineExpose({
  scrollToBottom
})
</script>

<template>
  <div class="ai-chat-shell">
    <section class="hero-card" :class="{ collapsed: heroCollapsed }">
      <div>
        <p class="eyebrow">
          {{ eyebrow }}
        </p>
        <h1>{{ title }}</h1>
        <p v-show="!heroCollapsed" class="hero-desc">
          {{ description }}
        </p>
      </div>
      <div class="hero-actions">
        <el-button
          v-if="collapsibleHero"
          text
          class="collapse-toggle"
          @click="toggleHeroCollapsed"
        >
          {{ heroCollapsed ? "展开说明" : "收起说明" }}
        </el-button>
        <slot name="hero-actions">
          <el-button :loading="historyLoading" @click="emit('refresh')">
            {{ refreshText }}
          </el-button>
          <el-popconfirm
            width="280"
            :title="clearConfirmText"
            confirm-button-text="确定"
            cancel-button-text="取消"
            :hide-after="0"
            :disabled="submitting || streaming"
            @confirm="emit('clear')"
          >
            <template #reference>
              <el-button type="danger" plain :disabled="submitting || streaming">
                {{ clearText }}
              </el-button>
            </template>
          </el-popconfirm>
        </slot>
      </div>
    </section>

    <section class="chat-layout">
      <aside class="chat-sidebar">
        <div v-if="stats.length" class="sidebar-panel">
          <p class="panel-label">
            会话状态
          </p>
          <div
            v-for="(item, index) in stats"
            :key="`${item.label}_${index}`"
            class="stat-row"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>

        <div v-if="quickPrompts.length" class="sidebar-panel">
          <p class="panel-label">
            预设问题
          </p>
          <button
            v-for="prompt in quickPrompts"
            :key="prompt"
            class="prompt-chip"
            :disabled="submitting || streaming"
            @click="handlePromptClick(prompt)"
          >
            {{ prompt }}
          </button>
        </div>

        <slot name="sidebar" />
      </aside>

      <div class="chat-main">
        <div ref="messageContainer" class="message-list" @scroll="handleMessageScroll">
          <div class="message-stack">
            <template v-if="messages.length">
              <article
                v-for="message in messages"
                :key="message.id"
                class="message-card"
                :class="message.role"
              >
                <div class="message-meta">
                  <span class="role-pill">{{ message.role === "user" ? "You" : "Assistant" }}</span>
                  <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                </div>
                <div class="message-content">
                  <RichContentRenderer :content="message.content" :chart-height="chartHeight" />
                </div>
              </article>
            </template>

            <div v-else class="empty-state">
              <h3>{{ emptyTitle }}</h3>
              <p>{{ emptyDescription }}</p>
            </div>

            <article v-if="streaming && pendingContent" class="message-card assistant live">
              <div class="message-meta">
                <span class="role-pill">Assistant</span>
                <span class="message-time">生成中</span>
              </div>
              <div class="message-content">
                <RichContentRenderer :content="pendingContent" :chart-height="chartHeight" />
              </div>
              <div class="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            </article>

            <button
              v-if="!shouldAutoScroll && (messages.length || pendingContent)"
              class="scroll-bottom-btn"
              type="button"
              @click="scrollToBottom(true)"
            >
              回到底部
            </button>
          </div>
        </div>

        <div class="composer">
          <slot name="composer-top" />
          <el-input
            v-model="draftValue"
            type="textarea"
            :rows="2"
            resize="none"
            maxlength="4000"
            show-word-limit
            :placeholder="placeholder"
            @keydown.enter.exact.prevent="handleSubmit"
          />
          <div class="composer-footer">
            <slot name="composer-footer-left">
              <p class="composer-tip">
                {{ tipText }}
              </p>
            </slot>
            <slot name="composer-footer-right">
              <el-button type="primary" :loading="submitting || streaming" @click="handleSubmit">
                {{ sendText }}
              </el-button>
            </slot>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.ai-chat-shell {
  --paper: #f7f1e8;
  --paper-strong: #efe5d8;
  --ink: #181511;
  --muted: #6d675f;
  --line: rgba(24, 21, 17, 0.12);
  --accent: #bf5a36;
  --accent-deep: #8f3c21;
  --assistant-bg: #f8f4ee;
  --user-bg: linear-gradient(135deg, #1a1815 0%, #312b23 100%);
  height: 100%;
  min-height: calc(100vh - 120px);
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(191, 90, 54, 0.16), transparent 28%),
    radial-gradient(circle at bottom right, rgba(38, 86, 124, 0.16), transparent 24%),
    linear-gradient(180deg, #f6efe3 0%, #f3ece0 100%);
  color: var(--ink);
}

.hero-card,
.chat-layout {
  width: min(1500px, 100%);
  margin: 0 auto;
}

.hero-card {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
  padding: 28px 30px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: rgba(255, 251, 245, 0.84);
  backdrop-filter: blur(18px);
  box-shadow: 0 20px 60px rgba(63, 38, 21, 0.08);

  h1 {
    margin: 8px 0 10px;
    font-size: 34px;
    line-height: 1.08;
    letter-spacing: -0.03em;
  }
}

.hero-card.collapsed {
  align-items: center;
  padding: 16px 20px;
  border-radius: 22px;

  h1 {
    margin: 4px 0 0;
    font-size: 22px;
    line-height: 1.12;
  }
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--accent);
}

.hero-desc {
  margin: 0;
  max-width: 760px;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse-toggle {
  color: var(--muted);
}

.chat-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 16px;
  min-height: 0;
  min-height: calc(75vh - 40px);
}

.chat-sidebar,
.chat-main {
  min-height: 0;
}

.chat-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
}

.sidebar-panel,
.chat-main {
  border: 1px solid var(--line);
  border-radius: 28px;
  background: rgba(255, 251, 245, 0.84);
  backdrop-filter: blur(18px);
  box-shadow: 0 20px 50px rgba(63, 38, 21, 0.06);
}

.sidebar-panel {
  padding: 18px;
}

.panel-label {
  margin: 0 0 16px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  font-size: 14px;
  border-bottom: 1px solid var(--line);

  &:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }
}

.prompt-chip {
  width: 100%;
  margin-bottom: 10px;
  padding: 14px 16px;
  border: 1px solid rgba(191, 90, 54, 0.18);
  border-radius: 18px;
  background: var(--paper);
  color: var(--ink);
  text-align: left;
  font-size: 14px;
  line-height: 1.5;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(191, 90, 54, 0.4);
    background: var(--paper-strong);
  }
}

.chat-main {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  overflow: hidden;
  min-height: 0;
}

.message-list {
  position: relative;
  overflow-y: auto;
  padding: 28px 32px;
  min-height: 0;
}

.message-stack {
  width: min(1320px, 100%);
  margin: 0 auto;
}

.scroll-bottom-btn {
  position: sticky;
  left: calc(100% - 140px);
  bottom: 16px;
  z-index: 3;
  display: block;
  width: 108px;
  margin-left: auto;
  padding: 10px 14px;
  border: 1px solid rgba(191, 90, 54, 0.22);
  border-radius: 999px;
  background: rgba(255, 251, 245, 0.92);
  color: var(--accent-deep);
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(14px);
  box-shadow: 0 10px 24px rgba(63, 38, 21, 0.12);
  cursor: pointer;
}

.message-card {
  width: 100%;
  margin-bottom: 18px;
  padding: 20px 24px;
  border-radius: 24px;
  border: 1px solid var(--line);
  white-space: pre-wrap;
  line-height: 1.75;
  animation: reveal 0.32s ease;
}

.message-card.user {
  width: min(70%, 900px);
  margin-left: auto;
  background: var(--user-bg);
  color: #f8f3eb;
  border-color: rgba(255, 255, 255, 0.06);
}

.message-card.assistant {
  background: var(--assistant-bg);
}

.message-card.live {
  box-shadow:
    0 0 0 1px rgba(191, 90, 54, 0.08),
    0 14px 30px rgba(191, 90, 54, 0.08);
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 12px;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(191, 90, 54, 0.12);
  color: var(--accent-deep);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.user .role-pill {
  background: rgba(255, 255, 255, 0.12);
  color: #f6dfd1;
}

.message-time {
  color: var(--muted);
}

.user .message-time {
  color: rgba(248, 243, 235, 0.72);
}

.message-content {
  font-size: 16px;
}

.user .message-content {
  :deep(pre) {
    background: rgba(255, 255, 255, 0.14);
    color: #fff9f2;
  }

  :deep(th),
  :deep(td) {
    border-color: rgba(255, 255, 255, 0.14);
  }

  :deep(th) {
    background: rgba(255, 255, 255, 0.08);
  }

  :deep(blockquote) {
    background: rgba(255, 255, 255, 0.08);
    border-left-color: rgba(255, 255, 255, 0.32);
  }

  :deep(code) {
    background: rgba(255, 255, 255, 0.12);
    color: inherit;
  }
}

.typing-indicator {
  display: inline-flex;
  gap: 6px;
  margin-top: 14px;

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    animation: pulse 1.1s infinite ease-in-out;
  }

  span:nth-child(2) {
    animation-delay: 0.16s;
  }

  span:nth-child(3) {
    animation-delay: 0.32s;
  }
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 100%;
  text-align: center;
  color: var(--muted);

  h3 {
    margin: 0 0 10px;
    font-size: 28px;
    color: var(--ink);
  }

  p {
    margin: 0;
    max-width: 420px;
    line-height: 1.7;
  }
}

.composer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  padding: 16px 32px 18px;
  border-top: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(255, 251, 245, 0.55), rgba(255, 251, 245, 0.96)), rgba(255, 251, 245, 0.92);
  backdrop-filter: blur(18px);
  box-shadow: 0 -12px 30px rgba(63, 38, 21, 0.06);
}

.composer :deep(.el-textarea__inner) {
  min-height: 72px !important;
  max-height: 72px !important;
  padding: 12px 16px;
  font-size: 15px;
  line-height: 1.5;
  border-radius: 22px;
  overflow-y: auto;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 14px;
}

.composer-tip {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    opacity: 0.24;
    transform: translateY(0);
  }

  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .chat-layout {
    grid-template-columns: 1fr;
  }

  .chat-sidebar,
  .chat-main {
    min-height: 0;
  }
}

@media (max-width: 768px) {
  .ai-chat-shell {
    padding: 14px;
  }

  .hero-card {
    padding: 22px 18px;
    border-radius: 24px;
    flex-direction: column;
    align-items: stretch;

    h1 {
      font-size: 28px;
    }
  }

  .hero-actions,
  .composer-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .chat-layout {
    min-height: calc(75vh - 24px);
  }

  .message-list,
  .composer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .message-stack {
    width: 100%;
  }

  .message-card {
    width: 100%;
    padding: 16px;
    border-radius: 20px;
  }
}
</style>
