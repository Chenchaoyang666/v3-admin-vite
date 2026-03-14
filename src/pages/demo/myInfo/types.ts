export interface WorkExperience {
  company: string
  position: string
  startDate: string
  endDate?: string
  description: string
}

export interface Education {
  school: string
  major: string
  degree: string
  graduationYear: string
}

export interface Project {
  name: string
  period?: string
  description: string
  techStack?: string
}

export interface ResumeData {
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

export interface ResumeResponse {
  code: number
  data: ResumeData | null
  message: string
}

export interface SaveResumeRequest {
  resume: ResumeData
}

export interface SaveResumeResponse {
  code: number
  data: ResumeData
  message: string
}
