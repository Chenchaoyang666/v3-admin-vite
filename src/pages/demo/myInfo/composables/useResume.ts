import type { ResumeData } from "../types"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import { getResumeApi, saveResumeApi } from "../api"

const DEFAULT_AVATAR = "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"

function getDefaultData(): ResumeData {
  return {
    name: "张三",
    title: "前端开发工程师",
    avatar: DEFAULT_AVATAR,
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
        description: "负责公司核心产品的前端开发，使用 Vue3 + TypeScript 构建高质量的前端应用。"
      }
    ],
    education: [
      {
        school: "某某大学",
        major: "计算机科学与技术",
        degree: "本科",
        graduationYear: "2020"
      }
    ],
    skills: ["Vue3", "TypeScript", "JavaScript", "Element Plus", "Vite", "CSS3"],
    projects: [
      {
        name: "某管理系统",
        period: "2020-2023",
        description: "为企业打造的一站式管理平台，提升办公效率。",
        techStack: "Vue3, TypeScript, Element Plus, Vite"
      }
    ]
  }
}

export function useResume() {
  const formData = ref<ResumeData>({})
  const loading = ref(false)
  const saving = ref(false)

  async function loadResume() {
    loading.value = true
    try {
      const response = await getResumeApi()
      formData.value = response.data ?? getDefaultData()
    } catch (error) {
      console.error("加载简历失败:", error)
      formData.value = getDefaultData()
    } finally {
      loading.value = false
    }
  }

  async function saveResume(data: ResumeData): Promise<boolean> {
    saving.value = true
    try {
      await saveResumeApi(data)
      formData.value = { ...data }
      ElMessage.success("保存成功")
      return true
    } catch (error) {
      console.error("保存失败:", error)
      ElMessage.error("保存失败")
      return false
    } finally {
      saving.value = false
    }
  }

  function onAvatarError() {
    formData.value = { ...formData.value, avatar: DEFAULT_AVATAR }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success("已复制到剪贴板")
    })
  }

  return { formData, loading, saving, DEFAULT_AVATAR, loadResume, saveResume, onAvatarError, copyToClipboard }
}
