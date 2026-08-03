export interface SkillGroup {
  label: string;
  value: string;
}

export interface ExperienceItem {
  title: string;
  company: string;
  location: string;
  dates: string;
  bullets: string[];
}

export interface ProjectItem {
  name: string;
  tools: string;
  bullets: string[];
}

export interface EducationItem {
  school: string;
  degree: string;
  dates: string;
}

export interface TailoredResume {
  atsScoreBefore: number;
  atsScoreAfter: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  notes: string[];
  name: string;
  contact: string;
  title: string;
  summary: string;
  skills: SkillGroup[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: string[];
}
