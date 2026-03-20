<template>
  <div class="resume-container">
    <!-- 加载状态 -->
    <el-skeleton v-if="loading" :rows="8" animated />

    <!-- 主内容 -->
    <template v-else>
      <el-row :gutter="24">
        <!-- 左侧个人信息栏 -->
        <el-col :xs="24" :sm="24" :md="8" :lg="6" :xl="5">
          <el-card class="profile-sidebar" shadow="hover">
            <!-- 头像区域 -->
            <div class="avatar-wrapper">
              <el-avatar :size="140" :src="formData.avatar || defaultAvatar" class="avatar" @error="onAvatarError" />
              <div class="avatar-overlay" @click="changeAvatar">
                <el-icon :size="32"><Camera /></el-icon>
                <span>更换头像</span>
              </div>
            </div>

            <!-- 姓名 -->
            <h1 class="name">{{ formData.name || "暂无姓名" }}</h1>

            <!-- 职位 -->
            <p class="title">{{ formData.title || "暂无职位" }}</p>

            <el-divider />

            <!-- 联系方式 -->
            <div class="contact-list">
              <div v-if="formData.phone" class="contact-item" @click="copyToClipboard(formData.phone)" title="点击复制">
                <el-icon class="contact-icon"><Phone /></el-icon>
                <span class="contact-text">{{ formData.phone }}</span>
                <el-icon class="copy-icon"><DocumentCopy /></el-icon>
              </div>

              <div v-if="formData.email" class="contact-item" @click="copyToClipboard(formData.email)" title="点击复制">
                <el-icon class="contact-icon"><Message /></el-icon>
                <span class="contact-text">{{ formData.email }}</span>
                <el-icon class="copy-icon"><DocumentCopy /></el-icon>
              </div>

              <div v-if="formData.location" class="contact-item">
                <el-icon class="contact-icon"><Location /></el-icon>
                <span class="contact-text">{{ formData.location }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧内容区 -->
        <el-col :xs="24" :sm="24" :md="16" :lg="18" :xl="19">
          <div class="content-area">
            <!-- 个人简介 -->
            <div v-if="formData.summary" class="resume-section">
              <div class="section-header">
                <el-icon class="section-icon"><User /></el-icon>
                <h3 class="section-title">个人简介</h3>
              </div>
              <p class="section-content">{{ formData.summary }}</p>
            </div>

            <!-- 工作经历 -->
            <div v-if="formData.workExperience?.length" class="resume-section">
              <div class="section-header">
                <el-icon class="section-icon" color="var(--el-color-primary)"><Briefcase /></el-icon>
                <h3 class="section-title">工作经历</h3>
              </div>
              <el-timeline class="custom-timeline">
                <el-timeline-item
                  v-for="(work, index) in formData.workExperience"
                  :key="index"
                  :timestamp="`${work.startDate} - ${work.endDate || '至今'}`"
                  placement="top"
                  color="var(--el-color-primary)"
                  class="timeline-item"
                  :class="{ visible: workVisible[index] }"
                >
                  <div class="timeline-content">
                    <h4 class="item-title">{{ work.company }}</h4>
                    <p class="item-subtitle">{{ work.position }}</p>
                    <p class="item-description">{{ work.description }}</p>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>

            <!-- 教育经历 -->
            <div v-if="formData.education?.length" class="resume-section">
              <div class="section-header">
                <el-icon class="section-icon" color="var(--el-color-success)"><Reading /></el-icon>
                <h3 class="section-title">教育经历</h3>
              </div>
              <el-timeline class="custom-timeline">
                <el-timeline-item
                  v-for="(edu, index) in formData.education"
                  :key="index"
                  :timestamp="edu.graduationYear"
                  placement="top"
                  color="var(--el-color-success)"
                  class="timeline-item"
                  :class="{ visible: eduVisible[index] }"
                >
                  <div class="timeline-content">
                    <h4 class="item-title">{{ edu.school }}</h4>
                    <p class="item-subtitle">{{ edu.major }}</p>
                    <p v-if="edu.degree" class="item-description">{{ edu.degree }}</p>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>

            <!-- 项目经历 -->
            <div v-if="formData.projects?.length" class="resume-section">
              <div class="section-header">
                <el-icon class="section-icon" color="var(--el-color-warning)"><FolderOpened /></el-icon>
                <h3 class="section-title">项目经历</h3>
              </div>
              <el-timeline class="custom-timeline">
                <el-timeline-item
                  v-for="(project, index) in formData.projects"
                  :key="index"
                  :timestamp="project.period || ''"
                  placement="top"
                  color="var(--el-color-warning)"
                  class="timeline-item"
                  :class="{ visible: projectVisible[index] }"
                >
                  <div class="timeline-content">
                    <h4 class="item-title">{{ project.name }}</h4>
                    <p class="item-description">{{ project.description }}</p>
                    <div v-if="project.techStack" class="tech-stack">
                      <span class="tech-label">技术栈：</span>
                      <span class="tech-items">{{ project.techStack }}</span>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>

            <!-- 技能标签云 -->
            <div v-if="formData.skills?.length" class="resume-section">
              <div class="section-header">
                <el-icon class="section-icon" color="var(--el-color-warning)"><Star /></el-icon>
                <h3 class="section-title">专业技能</h3>
              </div>
              <div class="skills-cloud">
                <el-tag
                  v-for="(skill) in formData.skills"
                  :key="skill"
                  :size="skill.length > 10 ? 'large' : 'default'"
                  :effect="(formData.skills.indexOf(skill) + 1) % 2 === 0 ? 'dark' : 'plain'"
                  class="skill-tag"
                  :style="{ background: getSkillGradient(skill) }"
                >
                  {{ skill }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 固定底部操作栏 -->
      <div class="action-bar">
        <el-button type="primary" size="large" @click="openEditDialog">
          <el-icon><Edit /></el-icon>
          编辑资料
        </el-button>
      </div>
    </template>

    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" title="编辑个人资料" width="900px" :close-on-click-modal="false" class="edit-dialog">
      <el-tabs v-model="activeTab" class="edit-tabs">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="editForm" label-width="100px" class="edit-form">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="姓名">
                  <el-input v-model="editForm.name" placeholder="请输入姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="职位">
                  <el-input v-model="editForm.title" placeholder="请输入职位" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="头像URL">
              <el-input v-model="editForm.avatar" placeholder="请输入头像URL" />
            </el-form-item>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="电话">
                  <el-input v-model="editForm.phone" placeholder="请输入电话" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="邮箱">
                  <el-input v-model="editForm.email" placeholder="请输入邮箱" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="所在地">
              <el-input v-model="editForm.location" placeholder="请输入所在地" />
            </el-form-item>

            <el-form-item label="个人简介">
              <el-input
                v-model="editForm.summary"
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
            <div v-for="(work, index) in editForm.workExperience" :key="index" class="form-item">
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
              <el-button type="danger" size="small" class="mt-2" @click="removeWorkExperience(index)">
                删除
              </el-button>
            </div>
            <el-button type="primary" @click="addWorkExperience">
              <el-icon><Plus /></el-icon>
              添加工作经历
            </el-button>
          </div>
        </el-tab-pane>

        <!-- 教育经历 -->
        <el-tab-pane label="教育经历" name="education">
          <div class="array-editor">
            <div v-for="(edu, index) in editForm.education" :key="index" class="form-item">
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
              <el-button type="danger" size="small" class="mt-2" @click="removeEducation(index)">
                删除
              </el-button>
            </div>
            <el-button type="primary" @click="addEducation">
              <el-icon><Plus /></el-icon>
              添加教育经历
            </el-button>
          </div>
        </el-tab-pane>

        <!-- 技能 -->
        <el-tab-pane label="专业技能" name="skills">
          <div class="skills-editor">
            <el-input
              v-model="skillInput"
              placeholder="输入技能后按回车添加"
              @keyup.enter="addSkill"
            >
              <template #append>
                <el-button @click="addSkill">添加</el-button>
              </template>
            </el-input>

            <div class="skills-list">
              <el-tag
                v-for="(skill) in editForm.skills || []"
                :key="skill"
                closable
                @close="removeSkill((editForm.skills || []).indexOf(skill))"
                class="skill-edit-tag"
                :style="{ background: getSkillGradient(skill) }"
              >
                {{ skill }}
              </el-tag>
            </div>
          </div>
        </el-tab-pane>

        <!-- 项目经历 -->
        <el-tab-pane label="项目经历" name="projects">
          <div class="array-editor">
            <div v-for="(project, index) in editForm.projects" :key="index" class="form-item">
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
              <el-button type="danger" size="small" class="mt-2" @click="removeProject(index)">
                删除
              </el-button>
            </div>
            <el-button type="primary" @click="addProject">
              <el-icon><Plus /></el-icon>
              添加项目经历
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveResume">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 头像选择对话框 -->
    <el-dialog v-model="avatarDialogVisible" title="更换头像" width="520px">
      <!-- 自定义上传区 -->
      <div class="avatar-upload-section">
        <p class="avatar-section-label">自定义上传</p>
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="image/jpeg,image/png,image/webp"
          drag
          :on-change="handleAvatarUpload"
          class="avatar-uploader"
        >
          <div v-if="uploadPreview" class="upload-preview">
            <el-avatar :size="100" :src="uploadPreview" />
            <p class="upload-preview-hint">点击重新上传</p>
          </div>
          <div v-else class="upload-placeholder">
            <el-icon :size="36" class="upload-icon"><Camera /></el-icon>
            <p class="upload-text">点击或拖拽图片到此处</p>
            <p class="upload-hint">支持 JPG / PNG / WebP，≤ 2MB</p>
          </div>
        </el-upload>
      </div>

      <el-divider content-position="center">或选择预设头像</el-divider>

      <!-- 预设头像 -->
      <div class="avatar-options">
        <div
          v-for="(avatar, index) in avatarOptions"
          :key="index"
          class="avatar-option"
          :class="{ active: selectedAvatar === avatar && !uploadPreview }"
          @click="selectAvatar(avatar)"
        >
          <el-avatar :size="80" :src="avatar" />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="avatarDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAvatar">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue"
import { ElMessage } from "element-plus"
import {
  Briefcase,
  Camera,
  DocumentCopy,
  Edit,
  FolderOpened,
  Location,
  Message,
  Phone,
  Plus,
  Reading,
  Star,
  User,
} from "@element-plus/icons-vue"
import { getResumeApi, saveResumeApi } from "./api"

interface WorkExperience {
  company: string
  position: string
  startDate: string
  endDate?: string
  description: string
}

interface Education {
  school: string
  major: string
  degree: string
  graduationYear: string
}

interface Project {
  name: string
  period?: string
  description: string
  techStack?: string
}

interface ResumeData {
  name?: string
  title?: string
  avatar?: string
  phone?: string
  email?: string
  location?: string
  summary?: string
  workExperience?: WorkExperience[]
  education?: Education[]
  skills?: string[]
  projects?: Project[]
}

// 默认头像
const defaultAvatar = "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"

// 头像选项
const avatarOptions = [
  "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png",
  "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
  "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a549440a0362a5e1png.png",
  "https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25944571jpeg.jpeg",
  "https://fuss10.elemecdn.com/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg",
]

// 状态
const loading = ref(false)
const formData = ref<ResumeData>({})
const editForm = ref<ResumeData>({})
const dialogVisible = ref(false)
const avatarDialogVisible = ref(false)
const saving = ref(false)
const skillInput = ref("")
const selectedAvatar = ref("")
const uploadPreview = ref("")
const activeTab = ref("basic")

// 时间轴动画可见状态
const workVisible = ref<Record<number, boolean>>({})
const eduVisible = ref<Record<number, boolean>>({})
const projectVisible = ref<Record<number, boolean>>({})

// 获取默认数据
function getDefaultData(): ResumeData {
  return {
    name: "张三",
    title: "前端开发工程师",
    avatar: defaultAvatar,
    phone: "13800138000",
    email: "zhangsan@example.com",
    location: "北京市",
    summary: "热爱前端开发，拥有丰富的项目经验，专注于用户体验和代码质量。善于学习新技术，具有良好的团队协作能力。",
    workExperience: [
      {
        company: "某某科技有限公司",
        position: "前端开发工程师",
        startDate: "2020-06",
        endDate: "",
        description: "负责公司核心产品的前端开发，使用 Vue3 + TypeScript 构建高质量的前端应用。",
      },
    ],
    education: [
      {
        school: "某某大学",
        major: "计算机科学与技术",
        degree: "本科",
        graduationYear: "2020",
      },
    ],
    skills: ["Vue3", "TypeScript", "JavaScript", "Element Plus", "Vite", "CSS3"],
    projects: [
      {
        name: "某管理系统",
        period: "2020-2023",
        description: "为企业打造的一站式管理平台，提升办公效率。",
        techStack: "Vue3, TypeScript, Element Plus, Vite",
      },
    ],
  }
}

// 加载简历数据
async function loadingResume() {
  loading.value = true
  try {
    const response = await getResumeApi()
    if (response.data) {
      formData.value = response.data
    } else {
      formData.value = getDefaultData()
    }
  } catch (error) {
    console.error("加载简历失败:", error)
    formData.value = getDefaultData()
  } finally {
    loading.value = false
  }
}

// 打开编辑对话框
function openEditDialog() {
  editForm.value = JSON.parse(JSON.stringify(formData.value))
  skillInput.value = ""
  activeTab.value = "basic"
  dialogVisible.value = true
}

// 保存简历
async function saveResume() {
  saving.value = true
  try {
    await saveResumeApi(editForm.value)
    formData.value = JSON.parse(JSON.stringify(editForm.value))
    dialogVisible.value = false
    ElMessage.success("保存成功")
  } catch (error) {
    console.error("保存失败:", error)
    ElMessage.error("保存失败")
  } finally {
    saving.value = false
  }
}

// 工作经历操作
function addWorkExperience() {
  if (!editForm.value.workExperience) {
    editForm.value.workExperience = []
  }
  editForm.value.workExperience.push({
    company: "",
    position: "",
    startDate: "",
    endDate: "",
    description: "",
  })
}

function removeWorkExperience(index: number) {
  editForm.value.workExperience?.splice(index, 1)
}

// 教育经历操作
function addEducation() {
  if (!editForm.value.education) {
    editForm.value.education = []
  }
  editForm.value.education.push({
    school: "",
    major: "",
    degree: "",
    graduationYear: "",
  })
}

function removeEducation(index: number) {
  editForm.value.education?.splice(index, 1)
}

// 技能操作
function addSkill() {
  if (skillInput.value.trim() && !editForm.value.skills?.includes(skillInput.value.trim())) {
    if (!editForm.value.skills) {
      editForm.value.skills = []
    }
    editForm.value.skills.push(skillInput.value.trim())
    skillInput.value = ""
  }
}

function removeSkill(index: number) {
  editForm.value.skills?.splice(index, 1)
}

// 项目经历操作
function addProject() {
  if (!editForm.value.projects) {
    editForm.value.projects = []
  }
  editForm.value.projects.push({
    name: "",
    period: "",
    description: "",
    techStack: "",
  })
}

function removeProject(index: number) {
  editForm.value.projects?.splice(index, 1)
}

// 头像操作
function changeAvatar() {
  selectedAvatar.value = formData.value.avatar || defaultAvatar
  uploadPreview.value = ""
  avatarDialogVisible.value = true
}

function selectAvatar(avatar: string) {
  selectedAvatar.value = avatar
  uploadPreview.value = ""
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 400
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", 0.85))
      }
      img.onerror = reject
      img.src = e.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function handleAvatarUpload(uploadFile: { raw?: File }) {
  const file = uploadFile.raw
  if (!file) return
  const ALLOWED = ["image/jpeg", "image/png", "image/webp"]
  if (!ALLOWED.includes(file.type)) {
    ElMessage.error("仅支持 JPG / PNG / WebP 格式")
    return
  }
  // if (file.size > 2 * 1024 * 1024) {
  //   ElMessage.error("图片大小不能超过 2MB")
  //   return
  // }
  const base64 = await compressImage(file)
  uploadPreview.value = base64
  selectedAvatar.value = base64
}

async function confirmAvatar() {
  formData.value.avatar = selectedAvatar.value
  avatarDialogVisible.value = false
  try {
    await saveResumeApi(formData.value)
    ElMessage.success("头像更换成功")
  } catch (error) {
    console.error("头像保存失败:", error)
    ElMessage.error("头像保存失败")
  }
}

// 头像加载失败容错：fallback 到默认头像
function onAvatarError() {
  formData.value.avatar = defaultAvatar
}

// 复制到剪贴板
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success("已复制到剪贴板")
  })
}

// 获取技能标签渐变背景
function getSkillGradient(skill: string) {
  const index = formData.value.skills?.indexOf(skill) || 0
  const hue = (index * 30) % 360
  return `linear-gradient(135deg, hsl(${hue}, 70%, 60%), hsl(${hue + 20}, 70%, 55%))`
}

// 时间轴动画
function animateTimelineItems() {
  const delay = (index: number) => index * 100

  formData.value.workExperience?.forEach((_, index) => {
    setTimeout(() => {
      workVisible.value[index] = true
    }, delay(index))
  })

  formData.value.education?.forEach((_, index) => {
    setTimeout(() => {
      eduVisible.value[index] = true
    }, delay(index))
  })

  formData.value.projects?.forEach((_, index) => {
    setTimeout(() => {
      projectVisible.value[index] = true
    }, delay(index))
  })
}

// 监听数据变化，触发动画
watch(formData, () => {
  workVisible.value = {}
  eduVisible.value = {}
  projectVisible.value = {}
  animateTimelineItems()
}, { deep: true })

// 组件挂载时加载数据
onMounted(async () => {
  await loadingResume()
  animateTimelineItems()
})
</script>

<style scoped lang="scss">
.resume-container {
  padding: 24px;
  min-height: 100vh;
  background: var(--el-bg-color-page);
}

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

.custom-timeline {
  padding-left: 8px;

  :deep(.el-timeline-item__timestamp) {
    color: var(--el-text-color-secondary);
    font-size: 14px;
    font-weight: 500;
  }

  :deep(.el-timeline-item__tail) {
    left: 4px;
  }

  :deep(.el-timeline-item__node) {
    left: -2px;
  }

  :deep(.el-timeline-item__wrapper) {
    padding-left: 28px;
  }
}

.timeline-item {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.timeline-content {
  padding: 16px;
  background: var(--el-fill-color-blank);
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateX(4px);
  }

  .item-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 8px 0;
  }

  .item-subtitle {
    font-size: 15px;
    font-weight: 500;
    color: var(--el-color-primary);
    margin: 0 0 12px 0;
  }

  .item-description {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.7;
    margin: 0 0 12px 0;
  }

  .tech-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;

    .tech-label {
      color: var(--el-text-color-secondary);
      font-size: 14px;
      font-weight: 500;
    }

    .tech-items {
      color: var(--el-color-warning);
      font-size: 14px;
    }
  }
}

.skills-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px;
  background: var(--el-fill-color-blank);
  border-radius: 12px;
}

.skill-tag {
  font-size: 14px;
  padding: 10px 18px;
  border: none;
  color: white;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s;
  }

  &:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);

    &::before {
      transform: translateX(100%);
    }
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

.mt-2 {
  margin-top: 8px;
}

// 响应式设计
@media (max-width: 1199px) {
  .resume-container {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .resume-container {
    padding: 12px;
  }

  .profile-sidebar {
    position: static;
    margin-bottom: 24px;
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

  .avatar-wrapper {
    width: 120px;
    height: 120px;
    margin: 0 auto 16px;
  }

  .name {
    font-size: 24px;
  }

  .resume-section .section-header .section-title {
    font-size: 18px;
  }
}
</style>
