import { describe, expect, it } from "vitest";
import {
  certificationInputSchema,
  educationInputSchema,
  experienceInputSchema,
  jobInputSchema,
  jobUpdateSchema,
  profileInputSchema,
  projectInputSchema,
  skillInputSchema,
  verifiedFactInputSchema,
} from "@/lib/schemas";

describe("entity schemas", () => {
  it("accepts a valid profile", () => {
    const parsed = profileInputSchema.safeParse({
      fullName: "Ada Lovelace",
      headline: "Engineer",
      summary: "Built things.",
      email: "ada@example.com",
      links: [{ label: "Site", url: "https://example.com" }],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid profile", () => {
    expect(profileInputSchema.safeParse({ fullName: "" }).success).toBe(false);
    expect(
      profileInputSchema.safeParse({
        fullName: "Ada",
        email: "not-an-email",
      }).success,
    ).toBe(false);
    expect(
      profileInputSchema.safeParse({
        fullName: "Ada",
        links: [{ label: "Site", url: "not-a-url" }],
      }).success,
    ).toBe(false);
  });

  it("validates experience dates as YYYY-MM", () => {
    const valid = experienceInputSchema.safeParse({
      company: "Acme",
      title: "Engineer",
      startDate: "2024-01",
      endDate: "2026-10",
      isCurrent: true,
    });
    expect(valid.success).toBe(true);

    expect(
      experienceInputSchema.safeParse({
        company: "Acme",
        title: "Engineer",
        startDate: "2024-13",
      }).success,
    ).toBe(false);

    expect(
      experienceInputSchema.safeParse({
        company: "Acme",
        title: "Engineer",
        startDate: "01/2024",
      }).success,
    ).toBe(false);
  });

  it("validates projects", () => {
    const valid = projectInputSchema.safeParse({
      name: "Toolkit",
      source: "github",
      githubRepoId: "12345",
      importance: 5,
      includeByDefault: false,
      confirmed: true,
    });
    expect(valid.success).toBe(true);

    expect(
      projectInputSchema.safeParse({
        name: "Toolkit",
        source: "gitlab",
      }).success,
    ).toBe(false);

    expect(
      projectInputSchema.safeParse({ name: "Toolkit", importance: 9 }).success,
    ).toBe(false);

    expect(
      projectInputSchema.safeParse({ name: "Toolkit", importance: 0 }).success,
    ).toBe(false);
  });

  it("validates skill evidence references", () => {
    const valid = skillInputSchema.safeParse({
      groupLabel: "Languages",
      name: "TypeScript",
      evidenceRefs: [{ kind: "project", refId: "abc" }],
    });
    expect(valid.success).toBe(true);

    expect(
      skillInputSchema.safeParse({
        name: "TypeScript",
        evidenceRefs: [{ kind: "unknown-source" }],
      }).success,
    ).toBe(false);

    expect(skillInputSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("validates education, certifications, verified facts and jobs", () => {
    expect(
      educationInputSchema.safeParse({
        school: "Polytechnic",
        degree: "BSc",
        startDate: "2018-09",
      }).success,
    ).toBe(true);
    expect(
      educationInputSchema.safeParse({ school: "", degree: "BSc" }).success,
    ).toBe(false);

    expect(
      certificationInputSchema.safeParse({
        name: "AWS SAA",
        issuer: "Amazon",
        issuedOn: "2023-05",
      }).success,
    ).toBe(true);
    expect(
      certificationInputSchema.safeParse({ name: "AWS SAA", url: "nope" })
        .success,
    ).toBe(false);

    expect(
      verifiedFactInputSchema.safeParse({
        questionKey: "scale",
        answerType: "none",
      }).success,
    ).toBe(true);
    expect(
      verifiedFactInputSchema.safeParse({
        questionKey: "scale",
        answerType: "maybe",
      }).success,
    ).toBe(false);

    expect(
      jobInputSchema.safeParse({ jdText: "We need an engineer." }).success,
    ).toBe(true);
    expect(jobInputSchema.safeParse({ jdText: "" }).success).toBe(false);
    expect(
      jobUpdateSchema.safeParse({ scoreAfter: 82, modelUsed: "gemini" }).success,
    ).toBe(true);
    expect(jobUpdateSchema.safeParse({ scoreAfter: 120 }).success).toBe(false);
  });
});
