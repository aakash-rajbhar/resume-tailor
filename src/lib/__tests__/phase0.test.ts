import { describe, expect, it } from "vitest";
import { computeScore } from "@/lib/score";
import { canonicalizeSkill, normalizeForMatch } from "@/lib/skills/synonyms";
import { cleanTextForHash } from "@/lib/cache";

const resume = `
John Doe
Software Engineer

Skills: React, Node.js, PostgreSQL, Git, JavaScript

Experience
Acme Corp - Backend Engineer
- Built REST APIs with Node.js and Express
- Designed PostgreSQL schemas and wrote complex SQL queries
- Used GitHub Actions for CI/CD pipelines
`;

const jd = {
  required: ["React", "Node.js", "PostgreSQL", "TypeScript"],
  preferred: ["Kubernetes", "Docker"],
};

describe("deterministic scoring", () => {
  it("weights required and preferred correctly", () => {
    const result = computeScore(jd, resume);
    expect(result.score).toBe(52);
    expect(result.matched).toEqual(
      expect.arrayContaining(["React", "Node.js", "PostgreSQL"]),
    );
    expect(result.missing).toEqual(
      expect.arrayContaining(["TypeScript", "Kubernetes", "Docker"]),
    );
  });

  it("normalizes JavaScript synonyms", () => {
    const result = computeScore({ required: ["JavaScript"], preferred: [] }, resume);
    expect(result.matched).toContain("JavaScript");
  });

  it("handles C++ correctly", () => {
    expect(canonicalizeSkill("C++")).toBe("cplusplus");
    expect(normalizeForMatch(".NET Core")).toContain("dotnet");
  });
});

describe("cache text normalization", () => {
  it("normalizes whitespace and bullets for hashing", () => {
    const a = "React\n- Built APIs\n  with Node.js";
    const b = "React\r\n• Built APIs\n\nwith   Node.js";
    expect(cleanTextForHash(a)).toBe(cleanTextForHash(b));
  });
});
