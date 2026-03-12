<template>
  <div class="demo-container">
    <!-- 语音演示区域 -->
    <section class="demo-section">
      <h3 class="section-title">语音播放演示</h3>
      <el-input v-model="speechText" type="textarea" :rows="4" placeholder="请输入要播放的文本" />
      <div class="control-buttons">
        <el-button type="primary" @click="speak(speechText)">播放</el-button>
        <el-button @click="pause">暂停</el-button>
        <el-button @click="resume">继续</el-button>
        <el-button type="danger" @click="stop">停止</el-button>
      </div>
      <p class="status-text">当前段落：{{ currentSegment }}</p>
    </section>

    <!-- 图片预览区域 -->
    <section class="demo-section">
      <h3 class="section-title">图片预览演示</h3>
      <el-image
        class="preview-image"
        :src="url"
        :zoom-rate="ZOOM_RATE"
        :max-scale="MAX_SCALE"
        :min-scale="MIN_SCALE"
        :preview-src-list="srcList"
        :initial-index="INITIAL_INDEX"
        fit="cover"
      />
    </section>

    <!-- 文本选取区域 -->
    <section class="demo-section">
      <h3 class="section-title">文本选取演示</h3>
      <div class="mobile-text-selector">
        <div class="control-bar">
          <button class="select-btn" @click="showTip">
            长按文本进行选取
          </button>
        </div>
        <div ref="textContainer" class="text-content">
          <h3>示例文档标题</h3>
          <p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p>
        </div>
        <!-- 悬浮操作菜单 -->
        <div
          v-if="showMenu && selectedText"
          class="floating-menu"
          :style="menuStyle"
        >
          <div class="menu-header">
            <span class="selected-preview">{{ selectedTextPreview }}</span>
          </div>
          <div class="menu-actions">
            <button
              v-for="item in menuItems"
              :key="item.label"
              class="menu-btn"
              @click="handleMenuAction(item.action)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from "vue"
import { ElMessage } from "element-plus"
import { showImagePreview } from "@/hooks/useImagePreview"
import { useSpeech } from "@/hooks/useSpeech"

// ============ 常量定义 ============
const ZOOM_RATE = 1.2
const MAX_SCALE = 7
const MIN_SCALE = 0.2
const INITIAL_INDEX = 4
const MENU_WIDTH = 160
const MENU_HEIGHT = 120
const MENU_OFFSET = 12
const PREVIEW_MAX_LENGTH = 20

const BASE_URL = "https://fuss10.elemecdn.com"
const IMAGE_URLS = [
  "/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg",
  "/1/34/19aa98b1fcb2781c4fba33d850549jpeg.jpeg",
  "/0/6f/e35ff375812e6b0020b6b4e8f9583jpeg.jpeg",
  "/9/bb/e27858e973f5d7f323f7974e6f78jpeg.jpeg",
  "/d/e6/c4d93a3805b3ce3f323f7974e6f78jpeg.jpeg",
  "/3/28/bbf893f792f03a54408b3b7a7ebf0jpeg.jpeg",
  "/2/11/6535bcfb26e4c79b48ddde44f4b6fjpeg.jpeg",
]

const PARAGRAPH_TEMPLATE = [
  "这是一段需要选取的文本内容。用户可以通过系统原生长按来选取范围，支持跨段落选择。",
  "第二段示例文本，展示多段落选取功能。选取的文字可以用于复制、翻译或分享等操作。",
  "移动端优化的交互体验，专为触摸屏幕设计，提供流畅的文字选取体验。",
]

// ============ 类型定义 ============
interface MenuItem {
  label: string
  action: () => void
}

// ============ 语音播放功能 ============
const speechText = ref("这里是超长文本……")
const { speak, pause, resume, stop, currentSegment } = useSpeech()

// ============ 图片预览功能 ============
const url = `${BASE_URL}${IMAGE_URLS[0]}`
const srcList = IMAGE_URLS.map((path) => `${BASE_URL}${path}`)

// 组件挂载时自动显示图片预览
onMounted(() => {
  showImagePreview({
    srcList: srcList.slice(0, 2),
    initialIndex: 1,
  })
})

// ============ 文本选取功能 ============
const textContainer = ref<HTMLElement | null>(null)
const selectedText = ref("")
const showMenu = ref(false)
const menuPosition = ref({ x: 0, y: 0 })

// 生成重复段落
const paragraphs = ref<string[]>([])
for (let i = 0; i < 4; i++) {
  paragraphs.value.push(...PARAGRAPH_TEMPLATE)
}

const menuItems: MenuItem[] = [
  { label: "复制", action: copyText },
  { label: "翻译", action: translateText },
  { label: "分享", action: shareText },
]

const selectedTextPreview = computed(() => {
  const text = selectedText.value
  return text.length > PREVIEW_MAX_LENGTH ? text.substring(0, PREVIEW_MAX_LENGTH) + "..." : text
})

const menuStyle = computed(() => ({
  left: `${menuPosition.value.x}px`,
  top: `${menuPosition.value.y}px`,
  transform: "translateX(-50%)",
}))

function showTip() {
  ElMessage.info("请长按文本进行系统选取")
}

function handleMenuAction(action: () => void) {
  action()
  showMenu.value = false
  selectedText.value = ""
}

function updateMenuPosition() {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  const containerRect = textContainer.value!.getBoundingClientRect()

  // 计算选区中心点相对于内容区的坐标
  const x = rect.left - containerRect.left + rect.width / 2
  let left = x

  // 防止菜单超出内容区左右边界
  if (left < MENU_WIDTH / 2) left = MENU_WIDTH / 2
  if (left > containerRect.width - MENU_WIDTH / 2) left = containerRect.width - MENU_WIDTH / 2

  // 菜单在选区正上方
  let top = Math.max(rect.top - containerRect.top - MENU_OFFSET - MENU_HEIGHT, 0)

  menuPosition.value = { x: left, y: top }
}

function handleSelectionEnd() {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    hideMenu()
    return
  }

  const text = selection.toString()
  if (text && selection.anchorNode && textContainer.value?.contains(selection.anchorNode)) {
    selectedText.value = text
    updateMenuPosition()
    showMenu.value = true
  } else {
    hideMenu()
  }
}

function onSelectionChange() {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    hideMenu()
  }
}

function hideMenu() {
  showMenu.value = false
  selectedText.value = ""
}

// 菜单操作
function copyText() {
  navigator.clipboard.writeText(selectedText.value).then(() => {
    ElMessage.success("复制成功")
  }).catch(() => {
    ElMessage.error("复制失败")
  })
}

function translateText() {
  ElMessage.info(`翻译文本: ${selectedText.value}`)
}

function shareText() {
  ElMessage.info(`分享文本: ${selectedText.value}`)
}

// 事件监听管理
onMounted(() => {
  textContainer.value?.addEventListener("pointerup", handleSelectionEnd)
  textContainer.value?.addEventListener("touchend", handleSelectionEnd)
  document.addEventListener("selectionchange", onSelectionChange)
})

onUnmounted(() => {
  textContainer.value?.removeEventListener("pointerup", handleSelectionEnd)
  textContainer.value?.removeEventListener("touchend", handleSelectionEnd)
  document.removeEventListener("selectionchange", onSelectionChange)
})
</script>

<style scoped lang="scss">
.demo-container {
  padding: 20px;
}

.demo-section {
  margin-bottom: 40px;
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.control-buttons {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.status-text {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.preview-image {
  width: 100px;
  height: 100px;
  border-radius: 4px;
}

.mobile-text-selector {
  position: relative;
}

.control-bar {
  position: sticky;
  top: 0;
  background: var(--el-bg-color);
  padding: 12px;
  display: flex;
  gap: 10px;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.select-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: #3498db;
  color: white;
  cursor: pointer;

  &:hover {
    background: #2980b9;
  }
}

.text-content {
  position: relative;
  padding: 20px;
  line-height: 1.8;
  font-size: 16px;
  color: var(--el-text-color-primary);

  h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
  }

  p {
    margin-bottom: 12px;
  }
}

.floating-menu {
  position: absolute;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 160px;
  border: 1px solid var(--el-border-color-lighter);
}

.menu-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.selected-preview {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  display: block;
;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-actions {
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.menu-btn {
  padding: 12px 16px;
;
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--el-text-color-primary);

  &:hover {
    background: var(--el-fill-color-light);
  }
}

@media (max-width: 768px) {
  .demo-container {
    padding: 12px;
  }

  .demo-section {
    padding: 12px;
  }

  .control-buttons {
    flex-wrap: wrap;
  }
}
</style>
