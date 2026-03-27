<script lang="ts" setup>
import type { ResumeData } from "../types"
import { Plus } from "@element-plus/icons-vue"
import { ref } from "vue"
import { getSkillGradient } from "../composables/useTimelineAnimation"

defineProps<{
  modelValue: boolean
  form: ResumeData
  skillInput: string
  saving: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  "update:skillInput": [value: string]
  "save": []
  "add-work": []
  "remove-work": [index: number]
  "add-education": []
  "remove-education": [index: number]
  "add-skill": []
  "remove-skill": [index: number]
  "add-project": []
  "remove-project": [index: number]
}>()

const activeTab = ref("basic")

defineExpose({ resetTab: () => {
  activeTab.value = "basic"
} })
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="编辑个人资料"
    width="900px"
    :close-on-click-modal="false"
    class="edit-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-tabs v-model="activeTab" class="edit-tabs">
      <!-- 基本信息 -->
      <el-tab-pane label="基本信息" name="basic">
        <el-form :model="form" label-width="100px" class="edit-form">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="姓名">
                <el-input v-model="form.name" placeholder="请输入姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="职位">
                <el-input v-model="form.title" placeholder="请输入职位" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="头像URL">
            <el-input v-model="form.avatar" placeholder="请输入头像URL" />
          </el-form-item>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="电话">
                <el-input v-model="form.phone" placeholder="请输入电话" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱">
                <el-input v-model="form.email" placeholder="请输入邮箱" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="所在地">
            <el-input v-model="form.location" placeholder="请输入所在地" />
          </el-form-item>
          <el-form-item label="个人简介">
            <el-input
              v-model="form.summary"
              type="textarea"
              :rows="4"
              placeholder="请输入个人简介"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 工作经历 -->
      <el-tab-pane label="工作经历" name="work">
        <div class="array-editor">
          <div v-for="(work, index) in form.workExperience" :key="index" class="form-item">
            <el-row :gutter="10">
              <el-col :span="8">
                <el-input v-model="work.company" placeholder="公司名称" />
              </el-col>
              <el-col :span="8">
                <el-input v-model="work.position" placeholder="职位" />
              </el-col>
              <el-col :span="4">
                <el-input v-model="work.startDate" placeholder="开始时间" />
              </el-col>
              <el-col :span="4">
                <el-input v-model="work.endDate" placeholder="结束时间" />
              </el-col>
            </el-row>
            <el-input v-model="work.description" placeholder="工作描述" class="mt-2" />
            <el-button type="danger" size="small" class="mt-2" @click="emit('remove-work', index)">
              删除
            </el-button>
          </div>
          <el-button type="primary" @click="emit('add-work')">
            <el-icon><Plus /></el-icon>添加工作经历
          </el-button>
        </div>
      </el-tab-pane>

      <!-- 教育经历 -->
      <el-tab-pane label="教育经历" name="education">
        <div class="array-editor">
          <div v-for="(edu, index) in form.education" :key="index" class="form-item">
            <el-row :gutter="10">
              <el-col :span="8">
                <el-input v-model="edu.school" placeholder="学校名称" />
              </el-col>
              <el-col :span="8">
                <el-input v-model="edu.major" placeholder="专业" />
              </el-col>
              <el-col :span="4">
                <el-input v-model="edu.degree" placeholder="学位" />
              </el-col>
              <el-col :span="4">
                <el-input v-model="edu.graduationYear" placeholder="毕业年份" />
              </el-col>
            </el-row>
            <el-button type="danger" size="small" class="mt-2" @click="emit('remove-education', index)">
              删除
            </el-button>
          </div>
          <el-button type="primary" @click="emit('add-education')">
            <el-icon><Plus /></el-icon>添加教育经历
          </el-button>
        </div>
      </el-tab-pane>

      <!-- 技能 -->
      <el-tab-pane label="专业技能" name="skills">
        <div class="skills-editor">
          <el-input :model-value="skillInput" placeholder="输入技能后按回车添加" @update:model-value="emit('update:skillInput', $event)" @keyup.enter="emit('add-skill')">
            <template #append>
              <el-button @click="emit('add-skill')">
                添加
              </el-button>
            </template>
          </el-input>
          <div class="skills-list">
            <el-tag
              v-for="(skill, index) in form.skills"
              :key="index"
              closable
              class="skill-edit-tag"
              :style="{ background: getSkillGradient(form.skills ?? [], skill) }"
              @close="emit('remove-skill', index)"
            >
              {{ skill }}
            </el-tag>
          </div>
        </div>
      </el-tab-pane>

      <!-- 项目经历 -->
      <el-tab-pane label="项目经历" name="projects">
        <div class="array-editor">
          <div v-for="(project, index) in form.projects" :key="index" class="form-item">
            <el-row :gutter="10">
              <el-col :span="12">
                <el-input v-model="project.name" placeholder="项目名称" />
              </el-col>
              <el-col :span="12">
                <el-input v-model="project.period" placeholder="项目周期" />
              </el-col>
            </el-row>
            <el-input v-model="project.description" placeholder="项目描述" class="mt-2" />
            <el-input v-model="project.techStack" placeholder="技术栈" class="mt-2" />
            <el-button type="danger" size="small" class="mt-2" @click="emit('remove-project', index)">
              删除
            </el-button>
          </div>
          <el-button type="primary" @click="emit('add-project')">
            <el-icon><Plus /></el-icon>添加项目经历
          </el-button>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="emit('update:modelValue', false)">
          取消
        </el-button>
        <el-button type="primary" :loading="saving" @click="emit('save')">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.edit-dialog {
  .edit-tabs {
    :deep(.el-tabs__nav) {
      border-bottom: 2px solid var(--el-border-color-lighter);
    }

    :deep(.el-tabs__item) {
      font-size: 15px;
      padding: 0 24px;

      &.is-active {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }
  }
}

.edit-form,
.array-editor,
.skills-editor {
  max-height: 60vh;
  overflow-y: auto;
  padding: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-blank);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 3px;

    &:hover {
      background: var(--el-border-color-darker);
    }
  }
}

.form-item {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 12px;
  margin-bottom: 16px;
}

.skills-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 16px;
    background: var(--el-fill-color-blank);
    border-radius: 12px;
    min-height: 60px;

    .skill-edit-tag {
      font-size: 14px;
      padding: 8px 16px;
      border: none;
      color: white;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.mt-2 {
  margin-top: 8px;
}
</style>
