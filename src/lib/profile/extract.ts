import { z } from "zod";

import { generateJSON, type AIConfig, type AIProvider } from "@/lib/ai";
import { cleanTextForHash, hashKey, withCache } from "@/lib/cache";
import { llmCache as fileCache } from "@/lib/cache";
import { EXTRACTION_FALLBACK_MODEL, PROFILE_EXTRACTION_MODEL } from "@/lib/models";
import { logger } from "@/lib/logger";

import { normalizeDrafts, type ProfileDrafts } from "./drafts";
import {
  PROFILE_PROMPT_VERSION,
  PROFILE_SYSTEM_PROMPT,
  buildSectionPrompt,
  type ProfileSection,
} from "./prompt";
import {
  profileCertificationsExtractionSchema,
  profileEducationExtractionSchema,
  profileExperienceExtractionSchema,
  profileProjectsExtractionSchema,
  profileSkillsExtractionSchema,
  profileSummaryExtractionSchema,
} from "./schemas";

/**
 * The profile extraction.
 *
 * One small call per section, each with its own schema, a pinned model and
 * temperature 0. The results are drafts: they are returned to the browser for
 * review and are never written to the database by this module.
 *
 * The cache is the file store, never the shared `llm_cache` table: the input
 * is the candidate's own resume, so it must not be shared between accounts.
 */

export const PROFILE_SECTIONS: ProfileSection[] = [
  "summary",
  "experience",
  "projects",
  "skills",
  "education",
  "certifications",
];

export interface ExtractProfileOptions {
  provider?: AIProvider;
  model?: string;
  config?: Partial<AIConfig>;
}

export interface SectionFailure {
  section: ProfileSection;
  message: string;
}

export interface ProfileExtractionResult {
  drafts: ProfileDrafts;
  /** The model that produced the sections. */
  modelUsed: string;
  /** True when the pinned model was unavailable and the fallback was used. */
  fallbackUsed: boolean;
  /** Sections that could not be extracted. The other sections still work. */
  failures: SectionFailure[];
  /** Sections that came from the cache. */
  cachedSections: ProfileSection[];
}

interface SectionMeta {
  modelUsed: string;
  fallbackUsed: boolean;
  cached: boolean;
}

interface SectionResult<T> extends SectionMeta {
  data: T;
}

function pinnedModel(provider: AIProvider): string {
  return provider === "groq" ? EXTRACTION_FALLBACK_MODEL : PROFILE_EXTRACTION_MODEL;
}

async function callSection<T>(
  section: ProfileSection,
  schema: z.ZodType<T>,
  resumeText: string,
  options: ExtractProfileOptions,
  provider: AIProvider,
  model: string,
): Promise<SectionResult<T>> {
  const key = hashKey(
    "profile-extract",
    PROFILE_PROMPT_VERSION,
    provider,
    model,
    section,
    cleanTextForHash(resumeText),
  );

  const { value, cached } = await withCache<SectionResult<T>>(
    key,
    async () => {
      const generated = await generateJSON<T>({
        system: PROFILE_SYSTEM_PROMPT,
        user: buildSectionPrompt(section, resumeText),
        schema,
        provider,
        model,
        config: options.config,
      });

      return {
        data: generated.data,
        modelUsed: generated.modelUsed,
        fallbackUsed: generated.fallbackUsed,
        cached: false,
      };
    },
    fileCache,
  );

  return { ...value, cached };
}

/**
 * Runs one section on the pinned model and falls back to the other provider
 * when that model is out of quota.
 */
async function runSection<T>(
  section: ProfileSection,
  schema: z.ZodType<T>,
  resumeText: string,
  options: ExtractProfileOptions,
): Promise<SectionResult<T>> {
  const provider = options.provider ?? "gemini";
  const model = options.model ?? pinnedModel(provider);

  try {
    return await callSection(section, schema, resumeText, options, provider, model);
  } catch (error) {
    if (provider === "groq") throw error;

    logger.warn("profile section fell back to the other provider", { section });
    const fallback = await callSection(
      section,
      schema,
      resumeText,
      options,
      "groq",
      pinnedModel("groq"),
    );
    return { ...fallback, fallbackUsed: true };
  }
}

/**
 * Extracts every profile section from a resume. Sections run one after the
 * other so a free tier is not hit with six calls at once, and a failing
 * section does not stop the others.
 */
export async function extractProfile(
  resumeText: string,
  options: ExtractProfileOptions = {},
): Promise<ProfileExtractionResult> {
  const failures: SectionFailure[] = [];
  const cachedSections: ProfileSection[] = [];
  let modelUsed = "";
  let fallbackUsed = false;

  const raw: {
    summary: z.infer<typeof profileSummaryExtractionSchema>;
    experience: z.infer<typeof profileExperienceExtractionSchema>;
    projects: z.infer<typeof profileProjectsExtractionSchema>;
    skills: z.infer<typeof profileSkillsExtractionSchema>;
    education: z.infer<typeof profileEducationExtractionSchema>;
    certifications: z.infer<typeof profileCertificationsExtractionSchema>;
  } = {
    summary: { headline: "", summary: "", location: "" },
    experience: { items: [] },
    projects: { items: [] },
    skills: { items: [] },
    education: { items: [] },
    certifications: { items: [] },
  };

  for (const section of PROFILE_SECTIONS) {
    try {
      let meta: SectionMeta | null = null;

      switch (section) {
        case "summary": {
          const result = await runSection(
            section,
            profileSummaryExtractionSchema,
            resumeText,
            options,
          );
          raw.summary = result.data;
          meta = result;
          break;
        }
        case "experience": {
          const result = await runSection(
            section,
            profileExperienceExtractionSchema,
            resumeText,
            options,
          );
          raw.experience = result.data;
          meta = result;
          break;
        }
        case "projects": {
          const result = await runSection(
            section,
            profileProjectsExtractionSchema,
            resumeText,
            options,
          );
          raw.projects = result.data;
          meta = result;
          break;
        }
        case "skills": {
          const result = await runSection(
            section,
            profileSkillsExtractionSchema,
            resumeText,
            options,
          );
          raw.skills = result.data;
          meta = result;
          break;
        }
        case "education": {
          const result = await runSection(
            section,
            profileEducationExtractionSchema,
            resumeText,
            options,
          );
          raw.education = result.data;
          meta = result;
          break;
        }
        case "certifications": {
          const result = await runSection(
            section,
            profileCertificationsExtractionSchema,
            resumeText,
            options,
          );
          raw.certifications = result.data;
          meta = result;
          break;
        }
      }

      if (meta) {
        if (!modelUsed) modelUsed = meta.modelUsed;
        fallbackUsed = fallbackUsed || meta.fallbackUsed;
        if (meta.cached) cachedSections.push(section);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The extraction failed.";
      failures.push({ section, message });
      logger.warn("profile section failed", { section });
    }
  }

  return {
    drafts: normalizeDrafts(raw),
    modelUsed,
    fallbackUsed,
    failures,
    cachedSections,
  };
}
