<template>
  <div class="mobile-text-selector">
    <div class="control-bar">
      <button class="select-btn" @click="showTip">
        长按文本进行选取
      </button>
    </div>
    <div ref="textContainer" class="text-content">
      <h3>示例文档标题</h3>
      <p>这是一段需要选取的文本内容。用户可以通过系统原生长按来选取范围，支持跨段落选择。</p>
      <p>第二段示例文本，展示多段落选取功能。选取的文字可以用于复制、翻译或分享等操作。</p>
      <p>移动端优化的交互体验，专为触摸屏幕设计，提供流畅的文字选取体验。</p>
    </div>
    <!-- 悬浮操作菜单 -->
    <div 
      v-if="showMenu && selectedText"
      class="floating-menu"
      :style="{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
        transform: 'translateX(-50%)'
      }"
    >
      <div class="menu-header">
        <span class="selected-preview">{{ selectedTextPreview }}</span>
      </div>
      <div class="menu-actions">
        <button 
          v-for="(item, index) in menuItems"
          :key="index"
          class="menu-btn"
          @click="handleMenuAction(item.action)"
        >
          {{ item.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const textContainer = ref(null);
const selectedText = ref('');
const showMenu = ref(false);
const menuPosition = ref({ x: 0, y: 0 });

const menuItems = [
  { label: '复制', action: copyText },
  { label: '翻译', action: translateText },
  { label: '分享', action: shareText }
];

const selectedTextPreview = computed(() => {
  const text = selectedText.value;
  return text.length > 20 ? text.substring(0, 20) + '...' : text;
});

function showTip() {
  alert('请长按文本进行系统选取');
}

function handleMenuAction(action) {
  action();
  showMenu.value = false;
  selectedText.value = '';
}

function updateMenuPosition() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const containerRect = textContainer.value.getBoundingClientRect();

  // 菜单宽度假定160px，可根据实际调整
  const menuWidth = 160;
  // 计算选区中心点相对于内容区的坐标
  const x = rect.left - containerRect.left + rect.width / 2;
  let left = x;
  // 防止菜单超出内容区左右边界
  if (left < menuWidth / 2) left = menuWidth / 2;
  if (left > containerRect.width - menuWidth / 2) left = containerRect.width - menuWidth / 2;

  // 菜单在选区正上方，距离选区顶部 12px（避免遮挡）
  let top = Math.max(rect.top - containerRect.top - 12 - 120, 0); // 40为菜单高度预估，可根据实际调整

  menuPosition.value = {
    x: left,
    y: top
  };
}

// 只在选区结束（松手）时弹出菜单
function handleSelectionEnd() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    showMenu.value = false;
    selectedText.value = '';
    return;
  }
  const text = selection.toString();
  if (text && selection.anchorNode && textContainer.value.contains(selection.anchorNode)) {
    selectedText.value = text;
    updateMenuPosition();
    showMenu.value = true;
  } else {
    showMenu.value = false;
    selectedText.value = '';
  }
}

// selectionchange 只负责清除菜单
function onSelectionChange() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    showMenu.value = false;
    selectedText.value = '';
  }
}

onMounted(() => {
  textContainer.value.addEventListener('pointerup', handleSelectionEnd);
  textContainer.value.addEventListener('touchend', handleSelectionEnd);
  document.addEventListener('selectionchange', onSelectionChange);
});
onUnmounted(() => {
  textContainer.value?.removeEventListener('pointerup', handleSelectionEnd);
  textContainer.value?.removeEventListener('touchend', handleSelectionEnd);
  document.removeEventListener('selectionchange', onSelectionChange);
});

// 菜单操作
function copyText() {
  navigator.clipboard.writeText(selectedText.value);
}
function translateText() {
  alert('翻译文本: ' + selectedText.value);
}
function shareText() {
  alert('分享文本: ' + selectedText.value);
}
</script>

<style scoped>
.mobile-text-selector {
  position: relative;
  max-width: 100%;
  margin: 0 auto;
}
.control-bar {
  position: sticky;
  top: 0;
  background: white;
  padding: 12px;
  display: flex;
  gap: 10px;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.select-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: #3498db;
  color: white;
}
.text-content {
  position: relative;
  padding: 20px;
  line-height: 1.8;
  font-size: 16px;
}
.floating-menu {
  position: absolute;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  z-index: 1000;
  min-width: 160px;
}
.menu-header {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}
.selected-preview {
  font-size: 14px;
  color: #666;
  display: block;
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
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
  border-radius: 6px;
}
.menu-btn:hover {
  background: #f8f9fa;
}
</style>