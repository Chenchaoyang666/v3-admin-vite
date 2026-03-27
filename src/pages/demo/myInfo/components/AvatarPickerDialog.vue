<script lang="ts" setup>
import { Camera } from "@element-plus/icons-vue"

defineProps<{
  modelValue: boolean
  avatarOptions: string[]
  selectedAvatar: string
  uploadPreview: string
}>()

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  "confirm": []
  "select-avatar": [avatar: string]
  "upload-change": [file: { raw?: File }]
}>()

function onSelectAvatar(avatar: string) {
  emit("select-avatar", avatar)
}

function onUploadChange(file: { raw?: File }) {
  emit("upload-change", file)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="更换头像"
    width="520px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="avatar-upload-section">
      <p class="avatar-section-label">
        自定义上传
      </p>
      <el-upload
        :auto-upload="false"
        :show-file-list="false"
        accept="image/jpeg,image/png,image/webp"
        drag
        :on-change="onUploadChange"
        class="avatar-uploader"
      >
        <div v-if="uploadPreview" class="upload-preview">
          <el-avatar :size="100" :src="uploadPreview" />
          <p class="upload-preview-hint">
            点击重新上传
          </p>
        </div>
        <div v-else class="upload-placeholder">
          <el-icon :size="36" class="upload-icon">
            <Camera />
          </el-icon>
          <p class="upload-text">
            点击或拖拽图片到此处
          </p>
          <p class="upload-hint">
            支持 JPG / PNG / WebP，≤ 2MB
          </p>
        </div>
      </el-upload>
    </div>

    <el-divider content-position="center">
      或选择预设头像
    </el-divider>

    <div class="avatar-options">
      <div
        v-for="(avatar, index) in avatarOptions"
        :key="index"
        class="avatar-option"
        :class="{ active: selectedAvatar === avatar && !uploadPreview }"
        @click="onSelectAvatar(avatar)"
      >
        <el-avatar :size="80" :src="avatar" />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="emit('update:modelValue', false)">
          取消
        </el-button>
        <el-button type="primary" @click="emit('confirm')">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.avatar-upload-section {
  padding: 0 16px;

  .avatar-section-label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0 0 10px 0;
    font-weight: 500;
  }

  .avatar-uploader {
    :deep(.el-upload-dragger) {
      padding: 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 120px;
    }
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    .upload-icon {
      color: var(--el-text-color-placeholder);
    }

    .upload-text {
      font-size: 14px;
      color: var(--el-text-color-regular);
      margin: 0;
    }

    .upload-hint {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      margin: 0;
    }
  }

  .upload-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    .upload-preview-hint {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      margin: 0;
    }
  }
}

.avatar-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px;
}

.avatar-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border: 2px solid var(--el-border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }

  &.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
