import { generateJSON, type AIConfig, type AIProvider } from "./ai";
import { cleanTextForHash, hashKey, withCache } from "./cache";
import { buildJDUserPrompt, JD_SYSTEM_PROMPT, PROMPT_VERSION } from "./prompt";
import { JdSchema, type Jd } from "./schemas";

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
  const key = hashKey("jd-extract", PROMPT_VERSION, cleanTextForHash(jdText));

  const { value, cached } = await withCache<CachedJD>(key, async () => {
    const generated = await generateJSON<Jd>({
      system: JD_SYSTEM_PROMPT,
      user: buildJDUserPrompt(jdText),
      schema: JdSchema,
      provider: options.provider,
      model: options.model,
      config: options.config,
    });
    return {
      jd: generated.data,
      modelUsed: generated.modelUsed,
      fallbackUsed: generated.fallbackUsed,
    };
  });

  return { ...value, cached };
}
