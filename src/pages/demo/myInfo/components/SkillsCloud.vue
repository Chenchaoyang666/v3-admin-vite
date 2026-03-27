<script lang="ts" setup>
import { Star } from "@element-plus/icons-vue"
import { getSkillGradient } from "../composables/useTimelineAnimation"

defineProps<{ skills: string[] | undefined }>()
</script>

<template>
  <div v-if="skills?.length" class="resume-section">
    <div class="section-header">
      <el-icon class="section-icon" color="var(--el-color-warning)">
        <Star />
      </el-icon>
      <h3 class="section-title">
        专业技能
      </h3>
    </div>
    <div class="skills-cloud">
      <el-tag
        v-for="(skill, index) in skills"
        :key="skill"
        :size="skill.length > 10 ? 'large' : 'default'"
        :effect="(index + 1) % 2 === 0 ? 'dark' : 'plain'"
        class="skill-tag"
        :style="{ background: getSkillGradient(skills, skill) }"
      >
        {{ skill }}
      </el-tag>
    </div>
  </div>
</template>

<style scoped lang="scss">
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

@media (max-width: 768px) {
  .resume-section .section-header .section-title {
    font-size: 18px;
  }
}
</style>
