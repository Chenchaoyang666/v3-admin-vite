<script lang="ts" setup>
import type { ResumeData } from "../types"
import { Camera, DocumentCopy, Location, Message, Phone } from "@element-plus/icons-vue"

defineProps<{ data: ResumeData, defaultAvatar: string }>()
const emit = defineEmits<{
  "change-avatar": []
  "copy": [text: string]
  "avatar-error": []
}>()
</script>

<template>
  <el-card class="profile-sidebar" shadow="hover">
    <!-- 头像区域 -->
    <div class="avatar-wrapper">
      <el-avatar :size="140" :src="data.avatar || defaultAvatar" class="avatar" @error="emit('avatar-error')" />
      <div class="avatar-overlay" @click="emit('change-avatar')">
        <el-icon :size="32">
          <Camera />
        </el-icon>
        <span>更换头像</span>
      </div>
    </div>

    <h1 class="name">
      {{ data.name || "暂无姓名" }}
    </h1>
    <p class="title">
      {{ data.title || "暂无职位" }}
    </p>

    <el-divider />

    <div class="contact-list">
      <div v-if="data.phone" class="contact-item" title="点击复制" @click="emit('copy', data.phone!)">
        <el-icon class="contact-icon">
          <Phone />
        </el-icon>
        <span class="contact-text">{{ data.phone }}</span>
        <el-icon class="copy-icon">
          <DocumentCopy />
        </el-icon>
      </div>
      <div v-if="data.email" class="contact-item" title="点击复制" @click="emit('copy', data.email!)">
        <el-icon class="contact-icon">
          <Message />
        </el-icon>
        <span class="contact-text">{{ data.email }}</span>
        <el-icon class="copy-icon">
          <DocumentCopy />
        </el-icon>
      </div>
      <div v-if="data.location" class="contact-item">
        <el-icon class="contact-icon">
          <Location />
        </el-icon>
        <span class="contact-text">{{ data.location }}</span>
      </div>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.profile-sidebar {
  position: sticky;
  top: 24px;
  border-radius: 16px;
  transition: all 0.3s ease;

  :deep(.el-card__body) {
    padding: 24px;
  }
}

.avatar-wrapper {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 0 auto 24px;

  .avatar {
    width: 100%;
    height: 100%;
    border: 4px solid var(--el-color-primary-light-9);
    transition: transform 0.3s ease;
  }

  .avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.3s ease;
    cursor: pointer;
    border: 4px solid transparent;

    span {
      font-size: 14px;
    }
  }

  &:hover .avatar {
    transform: scale(1.05);
  }

  &:hover .avatar-overlay {
    opacity: 1;
  }
}

.name {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.title {
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  color: var(--el-color-primary);
  margin: 0 0 24px 0;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: var(--el-fill-color-blank);

    .copy-icon {
      opacity: 1;
    }
  }

  .contact-icon {
    color: var(--el-color-primary);
    font-size: 18px;
  }

  .contact-text {
    flex: 1;
    color: var(--el-text-color-regular);
    font-size: 14px;
  }

  .copy-icon {
    color: var(--el-text-color-secondary);
    opacity: 0;
    transition: opacity 0.2s ease;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .profile-sidebar {
    position: static;
    margin-bottom: 24px;
  }

  .avatar-wrapper {
    width: 120px;
    height: 120px;
    margin: 0 auto 16px;
  }

  .name {
    font-size: 24px;
  }
}
</style>
