<script lang="ts" setup>
import { Briefcase, Edit, FolderOpened, Reading, User } from "@element-plus/icons-vue"
import { onMounted } from "vue"
import AvatarPickerDialog from "./components/AvatarPickerDialog.vue"
import EditDialog from "./components/EditDialog.vue"
import ProfileSidebar from "./components/ProfileSidebar.vue"
import ResumeTimeline from "./components/ResumeTimeline.vue"
import SkillsCloud from "./components/SkillsCloud.vue"
import { AVATAR_OPTIONS, useAvatarPicker } from "./composables/useAvatarPicker"
import { useResume } from "./composables/useResume"
import { useResumeEdit } from "./composables/useResumeEdit"
import { useTimelineAnimation } from "./composables/useTimelineAnimation"

const { formData, loading, saving, DEFAULT_AVATAR, loadResume, saveResume, onAvatarError, copyToClipboard } = useResume()
const { editForm, dialogVisible, skillInput, openEditDialog, addWorkExperience, removeWorkExperience, addEducation, removeEducation, addSkill, removeSkill, addProject, removeProject } = useResumeEdit()
const { avatarDialogVisible, selectedAvatar, uploadPreview, openAvatarPicker, selectAvatar, handleAvatarUpload, confirmAvatar } = useAvatarPicker()
const { workVisible, eduVisible, projectVisible, animateTimelineItems } = useTimelineAnimation(formData)

async function handleSave() {
  const ok = await saveResume(editForm.value)
  if (ok) dialogVisible.value = false
}

onMounted(async () => {
  await loadResume()
  animateTimelineItems()
})
</script>

<template>
  <div class="resume-container">
    <el-skeleton v-if="loading" :rows="8" animated />

    <template v-else>
      <el-row :gutter="24">
        <!-- 左侧个人信息栏 -->
        <el-col :xs="24" :sm="24" :md="8" :lg="6" :xl="5">
          <ProfileSidebar
            :data="formData"
            :default-avatar="DEFAULT_AVATAR"
            @change-avatar="openAvatarPicker(formData.avatar || DEFAULT_AVATAR)"
            @copy="copyToClipboard"
            @avatar-error="onAvatarError"
          />
        </el-col>

        <!-- 右侧内容区 -->
        <el-col :xs="24" :sm="24" :md="16" :lg="18" :xl="19">
          <div class="content-area">
            <!-- 个人简介 -->
            <div v-if="formData.summary" class="resume-section">
              <div class="section-header">
                <el-icon class="section-icon">
                  <User />
                </el-icon>
                <h3 class="section-title">
                  个人简介
                </h3>
              </div>
              <p class="section-content">
                {{ formData.summary }}
              </p>
            </div>

            <!-- 工作经历 -->
            <ResumeTimeline
              :items="formData.workExperience"
              title="工作经历"
              :icon="Briefcase"
              color="var(--el-color-primary)"
              :visible-map="workVisible"
              timestamp-key="startDate"
            >
              <template #default="{ item }">
                <h4 class="item-title">
                  {{ item.company }}
                </h4>
                <p class="item-subtitle">
                  {{ item.position }}
                </p>
                <p class="item-description">
                  {{ item.description }}
                </p>
              </template>
            </ResumeTimeline>

            <!-- 教育经历 -->
            <ResumeTimeline
              :items="formData.education"
              title="教育经历"
              :icon="Reading"
              color="var(--el-color-success)"
              :visible-map="eduVisible"
              timestamp-key="graduationYear"
            >
              <template #default="{ item }">
                <h4 class="item-title">
                  {{ item.school }}
                </h4>
                <p class="item-subtitle">
                  {{ item.major }}
                </p>
                <p v-if="item.degree" class="item-description">
                  {{ item.degree }}
                </p>
              </template>
            </ResumeTimeline>

            <!-- 项目经历 -->
            <ResumeTimeline
              :items="formData.projects"
              title="项目经历"
              :icon="FolderOpened"
              color="var(--el-color-warning)"
              :visible-map="projectVisible"
              timestamp-key="period"
            >
              <template #default="{ item }">
                <h4 class="item-title">
                  {{ item.name }}
                </h4>
                <p class="item-description">
                  {{ item.description }}
                </p>
                <div v-if="item.techStack" class="tech-stack">
                  <span class="tech-label">技术栈：</span>
                  <span class="tech-items">{{ item.techStack }}</span>
                </div>
              </template>
            </ResumeTimeline>

            <!-- 技能标签云 -->
            <SkillsCloud :skills="formData.skills" />
          </div>
        </el-col>
      </el-row>

      <!-- 固定底部操作栏 -->
      <div class="action-bar">
        <el-button type="primary" size="large" @click="openEditDialog(formData)">
          <el-icon><Edit /></el-icon>
          编辑资料
        </el-button>
      </div>
    </template>

    <!-- 编辑对话框 -->
    <EditDialog
      v-model="dialogVisible"
      :form="editForm"
      :skill-input="skillInput"
      :saving="saving"
      @save="handleSave"
      @add-work="addWorkExperience"
      @remove-work="removeWorkExperience"
      @add-education="addEducation"
      @remove-education="removeEducation"
      @add-skill="addSkill"
      @remove-skill="removeSkill"
      @add-project="addProject"
      @remove-project="removeProject"
      @update:skill-input="skillInput = $event"
    />

    <!-- 头像选择对话框 -->
    <AvatarPickerDialog
      v-model="avatarDialogVisible"
      :avatar-options="AVATAR_OPTIONS"
      :selected-avatar="selectedAvatar"
      :upload-preview="uploadPreview"
      @confirm="confirmAvatar(formData, (url) => { formData.avatar = url })"
      @select-avatar="selectAvatar"
      @upload-change="handleAvatarUpload"
    />
  </div>
</template>

<style scoped lang="scss">
.resume-container {
  padding: 24px;
  min-height: 100vh;
  background: var(--el-bg-color-page);
}

.content-area {
  padding-bottom: 80px;
}

.resume-section {
  margin-bottom: 48px;

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;

    .section-icon {
      font-size: 22px;
    }

    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--el-color-primary-light-5);
    }
  }

  .section-content {
    color: var(--el-text-color-regular);
    line-height: 1.8;
    margin: 0;
    font-size: 15px;
  }
}

.action-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  padding: 12px 24px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: center;
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@media (max-width: 1199px) {
  .resume-container {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .resume-container {
    padding: 12px;
  }

  .content-area {
    padding-bottom: 100px;
  }

  .action-bar {
    left: 16px;
    right: 16px;
    transform: none;
    width: auto;

    :deep(.el-button) {
      width: 100% !important;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>
