import type { ResumeData } from "../types"
import { ref, watch } from "vue"

export function getSkillGradient(skills: string[], skill: string): string {
  const index = skills.indexOf(skill)
  const hue = (index * 30) % 360
  return `linear-gradient(135deg, hsl(${hue}, 70%, 60%), hsl(${hue + 20}, 70%, 55%))`
}

export function useTimelineAnimation(formData: Readonly<{ value: ResumeData }>) {
  const workVisible = ref<Record<number, boolean>>({})
  const eduVisible = ref<Record<number, boolean>>({})
  const projectVisible = ref<Record<number, boolean>>({})

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

  function resetAndAnimate() {
    workVisible.value = {}
    eduVisible.value = {}
    projectVisible.value = {}
    animateTimelineItems()
  }

  watch(formData, resetAndAnimate, { deep: true })

  return { workVisible, eduVisible, projectVisible, animateTimelineItems }
}
