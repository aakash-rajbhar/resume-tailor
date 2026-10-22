import { describe, expect, it } from "vitest";

import {
  COMPLETENESS_WEIGHTS,
  computeCompleteness,
  type CompletenessInput,
} from "@/lib/profile/completeness";

/**
 * The completeness score is a pure function, so it is tested directly. The
 * score must stay inside 0-100 and the missing list must name the specific
 * thing that is missing.
 */

const EMPTY: CompletenessInput = {
  profile: null,
  experience: [],
  projects: [],
  skills: [],
  education: [],
  certifications: [],
};

const FULL: CompletenessInput = {
  profile: {
    fullName: "Ada Lovelace",
    headline: "Backend engineer",
    summary: "Builds payment services.",
    email: "ada@example.com",
    phone: "+91 98765 43210",
    location: "Bengaluru, India",
    githubUrl: "https://github.com/ada",
    linkedinUrl: "https://linkedin.com/in/ada",
    portfolioUrl: "https://ada.dev",
    links: [],
  },
  experience: [
    {
      company: "Acme",
      title: "Backend Engineer",
      bullets: ["Built the billing service."],
    },
  ],
  projects: [
    { name: "Ledger", summary: "A ledger.", bullets: ["Wrote the double entry model."] },
  ],
  skills: [{ name: "TypeScript", evidenceRefs: [{ kind: "experience", refId: "a" }] }],
  education: [{ school: "Anna University" }],
  certifications: [{ name: "AWS Certified Developer" }],
};

describe("computeCompleteness", () => {
  it("adds up to a hundred points", () => {
    const total = Object.values(COMPLETENESS_WEIGHTS).reduce(
      (sum, weight) => sum + weight,
      0,
    );
    expect(total).toBe(100);
  });

  it("scores an empty profile at zero and names what is missing", () => {
    const result = computeCompleteness(EMPTY);

    expect(result.score).toBe(0);
    expect(result.earned).toBe(0);
    expect(result.total).toBe(100);
    expect(result.missing).toContain("Add your name");
    expect(result.missing).toContain("Add work experience");
    expect(result.missing).toContain("Add a skill");
    expect(result.missing).toContain("Add education");
  });

  it("scores a complete profile at one hundred", () => {
    const result = computeCompleteness(FULL);

    expect(result.score).toBe(100);
    expect(result.missing).toEqual([]);
  });

  it("stays inside the 0-100 range", () => {
    const result = computeCompleteness({
      ...EMPTY,
      profile: FULL.profile,
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("names the roles that have no bullets", () => {
    const result = computeCompleteness({
      ...EMPTY,
      experience: [
        { company: "Acme", title: "Engineer", bullets: [] },
        { company: "Globex", title: "Engineer", bullets: ["Did the thing."] },
      ],
    });

    expect(result.missing).toContain("1 role has no bullets");
  });

  it("names the skills that have no evidence", () => {
    const result = computeCompleteness({
      ...EMPTY,
      skills: [
        { name: "TypeScript", evidenceRefs: [] },
        { name: "React", evidenceRefs: [{ kind: "manual", refId: "x" }] },
      ],
    });

    expect(result.missing).toContain("1 skill has no evidence");
  });

  it("counts a whitespace-only value as missing", () => {
    const result = computeCompleteness({
      ...EMPTY,
      profile: { ...FULL.profile, headline: "   " },
    });

    expect(result.missing).toContain("Add a headline");
  });
});
