import { generateJSON, type AIConfig, type AIProvider } from "./ai";
import { cleanTextForHash, hashKey, withCache } from "./cache";
import { cacheStoreFor } from "./cache/store";
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
  /**
   * Measurement-only override. When set, extraction uses exactly this
   * provider/model pair and does not fall back, so the caller can compare
   * providers directly. Normal API traffic leaves this unset and gets the
   * pinned model plus fallback.
   */
  extractionProvider?: AIProvider;
  extractionModel?: string;
}

/**
 * Pinned extraction model, overridable per deployment so a provider quota
 * block can be worked around without a code change. The override is read on
 * the server only and is part of the cache key, so switching models never
 * reuses another model's extraction.
 */
function pinnedExtractionModel(): string {
  return process.env.EXTRACTION_MODEL?.trim() || EXTRACTION_MODEL;
}

function fallbackExtractionModel(): string {
  return process.env.EXTRACTION_FALLBACK_MODEL?.trim() || EXTRACTION_FALLBACK_MODEL;
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
    const store = cacheStoreFor("jd-extract", {
      model,
      promptVersion: EXTRACT_PROMPT_VERSION,
    });
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
    }, store);
    return { ...value, cached };
  }

  if (options.extractionProvider) {
    const result = await runExtraction(
      options.extractionProvider,
      options.extractionModel ??
        (options.extractionProvider === "groq"
          ? fallbackExtractionModel()
          : pinnedExtractionModel()),
    );
    return { ...result, extractionFallback: result.fallbackUsed };
  }

  try {
    const primary = await runExtraction("gemini", pinnedExtractionModel());
    return {
      ...primary,
      extractionFallback: primary.fallbackUsed,
    };
  } catch {
    const fallback = await runExtraction("groq", fallbackExtractionModel());
    return {
      ...fallback,
      extractionFallback: true,
    };
  }
}

