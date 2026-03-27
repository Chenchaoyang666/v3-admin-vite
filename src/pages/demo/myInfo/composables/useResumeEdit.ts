import type { Education, Project, ResumeData, WorkExperience } from "../types"
import { ref } from "vue"

export function useResumeEdit() {
  const editForm = ref<ResumeData>({})
  const dialogVisible = ref(false)
  const activeTab = ref("basic")
  const skillInput = ref("")

  function openEditDialog(formData: ResumeData) {
    editForm.value = JSON.parse(JSON.stringify(formData))
    skillInput.value = ""
    activeTab.value = "basic"
    dialogVisible.value = true
  }

  // 工作经历
  function addWorkExperience() {
    const item: WorkExperience = { company: "", position: "", startDate: "", endDate: "", description: "" }
    editForm.value = {
      ...editForm.value,
      workExperience: [...(editForm.value.workExperience ?? []), item]
    }
  }

  function removeWorkExperience(index: number) {
    editForm.value = {
      ...editForm.value,
      workExperience: editForm.value.workExperience?.filter((_, i) => i !== index)
    }
  }

  // 教育经历
  function addEducation() {
    const item: Education = { school: "", major: "", degree: "", graduationYear: "" }
    editForm.value = {
      ...editForm.value,
      education: [...(editForm.value.education ?? []), item]
    }
  }

  function removeEducation(index: number) {
    editForm.value = {
      ...editForm.value,
      education: editForm.value.education?.filter((_, i) => i !== index)
    }
  }

  // 技能
  function addSkill() {
    const skill = skillInput.value.trim()
    if (!skill || editForm.value.skills?.includes(skill)) return
    editForm.value = {
      ...editForm.value,
      skills: [...(editForm.value.skills ?? []), skill]
    }
    skillInput.value = ""
  }

  function removeSkill(index: number) {
    editForm.value = {
      ...editForm.value,
      skills: editForm.value.skills?.filter((_, i) => i !== index)
    }
  }

  // 项目经历
  function addProject() {
    const item: Project = { name: "", period: "", description: "", techStack: "" }
    editForm.value = {
      ...editForm.value,
      projects: [...(editForm.value.projects ?? []), item]
    }
  }

  function removeProject(index: number) {
    editForm.value = {
      ...editForm.value,
      projects: editForm.value.projects?.filter((_, i) => i !== index)
    }
  }

  return {
    editForm,
    dialogVisible,
    activeTab,
    skillInput,
    openEditDialog,
    addWorkExperience,
    removeWorkExperience,
    addEducation,
    removeEducation,
    addSkill,
    removeSkill,
    addProject,
    removeProject
  }
}
