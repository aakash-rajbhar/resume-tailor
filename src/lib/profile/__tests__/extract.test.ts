import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateJSON } from "@/lib/ai";
import { extractProfile } from "@/lib/profile/extract";

/**
 * The extraction runs one small call per section. The model is mocked here,
 * so the test never touches the network, and the cache is bypassed so the
 * mock is always called.
 */

vi.mock("@/lib/ai", () => ({
  generateJSON: vi.fn(),
}));

vi.mock("@/lib/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/cache")>();
  return {
    ...actual,
    withCache: async <T>(_key: string, producer: () => Promise<T>) => ({
      value: await producer(),
      cached: false,
    }),
  };
});

const mockedGenerateJSON = vi.mocked(generateJSON);

type Section = "summary" | "experience" | "projects" | "skills" | "education" | "certifications";

/** The section a prompt belongs to, read from its instruction. */
function sectionOf(user: string): Section {
  if (user.includes("headline")) return "summary";
  if (user.includes("every role")) return "experience";
  if (user.includes("every project")) return "projects";
  if (user.includes("groupLabel")) return "skills";
  if (user.includes("every education entry")) return "education";
  return "certifications";
}

const RESPONSES: Record<Section, unknown> = {
  summary: {
    headline: "Backend Engineer",
    summary: "Backend engineer working on payments.",
    location: "Bengaluru",
  },
  experience: {
    items: [
      {
        company: "Acme",
        title: "Backend Engineer",
        location: "Bengaluru",
        startDate: "Jan 2021",
        endDate: "Present",
        isCurrent: true,
        bullets: ["Built the billing service."],
      },
    ],
  },
  projects: {
    items: [
      {
        name: "Ledger CLI",
        summary: "Reads a ledger file.",
        bullets: ["Shipped a parser."],
        tools: ["TypeScript"],
        startDate: "",
        endDate: "",
      },
    ],
  },
  skills: {
    items: [
      { name: "TypeScript", groupLabel: "Languages" },
      { name: "PostgreSQL", groupLabel: "Databases" },
    ],
  },
  education: {
    items: [
      {
        school: "Anna University",
        degree: "Bachelor of Engineering",
        fieldOfStudy: "Computer Science",
        startDate: "",
        endDate: "",
      },
    ],
  },
  certifications: {
    items: [{ name: "AWS Certified Developer", issuer: "Amazon Web Services", issuedOn: "" }],
  },
};

function respondWith() {
  mockedGenerateJSON.mockImplementation(async (options) => {
    const section = sectionOf(options.user);
    return {
      data: RESPONSES[section] as never,
      text: "{}",
      provider: "gemini",
      modelUsed: "gemini-3.6-flash",
      fallbackUsed: false,
    };
  });
}

describe("extractProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    respondWith();
  });

  it("asks for one section at a time and returns the drafts", async () => {
    const result = await extractProfile("Resume text without contact details.");

    expect(mockedGenerateJSON).toHaveBeenCalledTimes(6);
    expect(result.failures).toEqual([]);
    expect(result.drafts.summary.headline).toBe("Backend Engineer");
    expect(result.drafts.experience).toHaveLength(1);
    expect(result.drafts.experience[0].company).toBe("Acme");
    expect(result.drafts.experience[0].startDate.iso).toBe("2021-01");
    expect(result.drafts.experience[0].isCurrent).toBe(true);
    expect(result.drafts.projects[0].name).toBe("Ledger CLI");
    expect(result.drafts.skills.map((skill) => skill.name)).toEqual([
      "PostgreSQL",
      "TypeScript",
    ]);
    expect(result.drafts.education[0].school).toBe("Anna University");
    expect(result.drafts.certifications[0].name).toBe("AWS Certified Developer");
  });

  it("keeps the other sections when one of them fails", async () => {
    mockedGenerateJSON.mockImplementation(async (options) => {
      if (sectionOf(options.user) === "skills") {
        throw new Error("the model is out of quota");
      }
      const section = sectionOf(options.user);
      return {
        data: RESPONSES[section] as never,
        text: "{}",
        provider: "gemini",
        modelUsed: "gemini-3.6-flash",
        fallbackUsed: false,
      };
    });

    const result = await extractProfile("Resume text without contact details.");

    expect(result.failures.map((failure) => failure.section)).toEqual(["skills"]);
    expect(result.drafts.experience).toHaveLength(1);
    expect(result.drafts.skills).toEqual([]);
  });

  it("falls back to the other provider when the pinned model is out of quota", async () => {
    mockedGenerateJSON.mockImplementation(async (options) => {
      if (options.provider === "gemini") {
        throw new Error("rate limited");
      }
      const section = sectionOf(options.user);
      return {
        data: RESPONSES[section] as never,
        text: "{}",
        provider: "groq" as const,
        modelUsed: "openai/gpt-oss-20b",
        fallbackUsed: true,
      };
    });

    const result = await extractProfile("Resume text without contact details.");

    expect(result.failures).toEqual([]);
    expect(result.fallbackUsed).toBe(true);
    expect(result.modelUsed).toBe("openai/gpt-oss-20b");
    expect(result.drafts.experience[0].company).toBe("Acme");
  });

  it("never sends the raw file, only the text it was given", async () => {
    await extractProfile("Resume text without contact details.");

    const prompts = mockedGenerateJSON.mock.calls.map((call) => call[0].user);
    for (const prompt of prompts) {
      expect(prompt).toContain("Resume text without contact details.");
    }
  });
});
