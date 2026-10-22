import { generateJSON, type AIConfig, type AIProvider } from "./ai";
import { cleanTextForHash, hashKey, withCache } from "./cache";
import {
  buildJDUserPrompt,
  EXTRACT_PROMPT_VERSION,
  JD_SYSTEM_PROMPT,
} from "./prompt";
import { JdSchema, type Jd } from "./schemas";
import { EXTRACTION_FALLBACK_MODEL, EXTRACTION_MODEL } from "./models";
import { canonicalizeExtractedSkills } from "./extractCanonicalize";

export interface ExtractJDOptions {
  provider?: AIProvider;
  model?: string;
  config?: Partial<AIConfig>;
}

export interface ExtractJDResult {
  jd: Jd;
  modelUsed: string;
  fallbackUsed: boolean;
  cached: boolean;
  extractionFallback?: boolean;
}

interface CachedJD {
  jd: Jd;
  modelUsed: string;
  fallbackUsed: boolean;
}

/**
 * Extracts the job description's requirements once and caches the result by
 * JD hash, so the same job description always yields the same keyword set
 * regardless of provider, model or run.
 */
export async function extractJD(
  jdText: string,
  options: ExtractJDOptions = {},
): Promise<ExtractJDResult> {
  const cleaned = cleanTextForHash(jdText);

  async function runExtraction(
    provider: AIProvider,
    model: string,
  ) {
    const key = hashKey("jd-extract", EXTRACT_PROMPT_VERSION, model, cleaned);
    const { value, cached } = await withCache<CachedJD>(key, async () => {
      const generated = await generateJSON<Jd>({
        system: JD_SYSTEM_PROMPT,
        user: buildJDUserPrompt(jdText),
        schema: JdSchema,
        provider,
        model,
        config: options.config,
      });

      // apply canonicalizer
      const canonReq = canonicalizeExtractedSkills(generated.data.required_skills);
      const canonPref = canonicalizeExtractedSkills(generated.data.preferred_skills);
      const jd: Jd = {
        ...generated.data,
        required_skills: canonReq.skills,
        preferred_skills: canonPref.skills,
        other_requirements: [
          ...(generated.data.other_requirements ?? []),
          ...canonReq.movedToOther,
          ...canonPref.movedToOther,
        ],
      };

      return {
        jd,
        modelUsed: generated.modelUsed,
        fallbackUsed: generated.fallbackUsed,
      };
    });
    return { ...value, cached };
  }

  try {
    const primary = await runExtraction("gemini", EXTRACTION_MODEL);
    return {
      ...primary,
      extractionFallback: primary.fallbackUsed,
    };
  } catch {
    const fallback = await runExtraction("groq", EXTRACTION_FALLBACK_MODEL);
    return {
      ...fallback,
      extractionFallback: true,
    };
  }
}

