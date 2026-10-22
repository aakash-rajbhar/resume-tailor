import { describe, expect, it } from "vitest";

import {
  profileCertificationsExtractionSchema,
  profileEducationExtractionSchema,
  profileExperienceExtractionSchema,
  profileProjectsExtractionSchema,
  profileSectionKeySchema,
  profileSectionSaveSchema,
  profileSkillsExtractionSchema,
  profileSummaryExtractionSchema,
} from "@/lib/profile/schemas";

/**
 * The extraction schemas describe what a model may return: every field is
 * optional and every array is bounded, so a thin or noisy resume still
 * validates. The section save schema is the only way into the database, so
 * it must reject anything malformed.
 */

describe("the extraction schemas", () => {
  it("accepts an empty summary", () => {
    const parsed = profileSummaryExtractionSchema.parse({});
    expect(parsed.headline).toBe("");
    expect(parsed.summary).toBe("");
    expect(parsed.location).toBe("");
  });

  it("accepts an empty section", () => {
    expect(profileExperienceExtractionSchema.parse({}).items).toEqual([]);
    expect(profileProjectsExtractionSchema.parse({}).items).toEqual([]);
    expect(profileSkillsExtractionSchema.parse({}).items).toEqual([]);
    expect(profileEducationExtractionSchema.parse({}).items).toEqual([]);
    expect(profileCertificationsExtractionSchema.parse({}).items).toEqual([]);
  });

  it("keeps the values a model returns", () => {
    const parsed = profileExperienceExtractionSchema.parse({
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
    });

    expect(parsed.items[0].company).toBe("Acme");
    expect(parsed.items[0].isCurrent).toBe(true);
    expect(parsed.items[0].bullets).toHaveLength(1);
  });

  it("refuses a skill without a name", () => {
    const parsed = profileSkillsExtractionSchema.safeParse({
      items: [{ name: "", groupLabel: "Languages" }],
    });
    expect(parsed.success).toBe(false);
  });

  it("refuses more items than the bound allows", () => {
    const items = Array.from({ length: 61 }, (_, index) => ({
      name: `Skill ${index}`,
      groupLabel: "",
    }));
    expect(profileSkillsExtractionSchema.safeParse({ items }).success).toBe(false);
  });

  it("refuses an over-long bullet", () => {
    const parsed = profileExperienceExtractionSchema.safeParse({
      items: [
        {
          company: "Acme",
          title: "Engineer",
          bullets: ["x".repeat(601)],
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("profileSectionKeySchema", () => {
  it("knows the six sections", () => {
    expect(profileSectionKeySchema.parse("profile")).toBe("profile");
    expect(profileSectionKeySchema.parse("certifications")).toBe("certifications");
    expect(profileSectionKeySchema.safeParse("github").success).toBe(false);
  });
});

describe("profileSectionSaveSchema", () => {
  it("accepts a profile", () => {
    const parsed = profileSectionSaveSchema.safeParse({
      section: "profile",
      profile: {
        fullName: "Ada Lovelace",
        headline: "Backend engineer",
        summary: "",
        email: "ada@example.com",
        phone: null,
        location: "Bengaluru",
        links: [],
        githubUrl: null,
        linkedinUrl: null,
        portfolioUrl: null,
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("refuses a profile without a name", () => {
    const parsed = profileSectionSaveSchema.safeParse({
      section: "profile",
      profile: { fullName: "", headline: "", summary: "", links: [] },
    });
    expect(parsed.success).toBe(false);
  });

  it("refuses a role without a company", () => {
    const parsed = profileSectionSaveSchema.safeParse({
      section: "experience",
      items: [{ company: "", title: "Engineer", sortOrder: 0 }],
    });
    expect(parsed.success).toBe(false);
  });

  it("refuses a date that is not YYYY-MM", () => {
    const parsed = profileSectionSaveSchema.safeParse({
      section: "experience",
      items: [
        {
          company: "Acme",
          title: "Engineer",
          startDate: "January 2021",
          sortOrder: 0,
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("refuses a section it does not know", () => {
    const parsed = profileSectionSaveSchema.safeParse({ section: "github" });
    expect(parsed.success).toBe(false);
  });

  it("accepts a list of skills with their evidence", () => {
    const parsed = profileSectionSaveSchema.safeParse({
      section: "skills",
      items: [
        {
          groupLabel: "Languages",
          name: "TypeScript",
          evidenceRefs: [{ kind: "experience", refId: "row-1", note: "Engineer at Acme" }],
          sortOrder: 0,
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });
});
