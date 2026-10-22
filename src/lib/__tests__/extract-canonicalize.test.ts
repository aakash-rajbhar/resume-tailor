import { describe, expect, it } from "vitest";
import { canonicalizeExtractedSkill, canonicalizeExtractedSkills } from "@/lib/extractCanonicalize";

describe("extract canonicalizer", () => {
  it("trims generic suffix words", () => {
    expect(canonicalizeExtractedSkill("Git/GitHub workflows")).toBeTruthy();
    expect(canonicalizeExtractedSkills(["Git/GitHub workflows"])).toEqual({
      skills: expect.arrayContaining(["git", "github"]),
      movedToOther: [],
    });
  });

  it("splits compounds on / , and and", () => {
    const res = canonicalizeExtractedSkills(["Git/GitHub workflows"]);
    expect(res.skills).toContain("git");
    expect(res.skills).toContain("github");
  });

  it("handles comma split", () => {
    const res = canonicalizeExtractedSkills(["unit, integration and end-to-end testing"]);
    expect(res.skills).toEqual(expect.arrayContaining(["unit testing", "integration testing", "end-to-end testing"]));
  });

  it("protects CI/CD", () => {
    const res = canonicalizeExtractedSkills(["CI/CD pipelines"]);
    expect(res.skills).toContain("ci/cd");
  });

  it("protects TCP/IP, A/B, I/O", () => {
    expect(canonicalizeExtractedSkill("TCP/IP")).toBe("tcp/ip");
    expect(canonicalizeExtractedSkill("A/B")).toBe("a/b");
    expect(canonicalizeExtractedSkill("I/O")).toBe("i/o");
  });

  it("drops entries longer than 4 words to movedToOther", () => {
    const long = "build scalable distributed systems across cloud platforms";
    const res = canonicalizeExtractedSkills([long]);
    expect(res.skills).not.toContain(long);
    expect(res.movedToOther.length).toBe(1);
  });

  it("applies alias map style and dedupes and sorts", () => {
    const res = canonicalizeExtractedSkills(["React", "react", "Node.js"]);
    expect(res.skills).toEqual(["node.js", "react"]);
  });

  it("light singular/plural handling REST APIs <-> REST API", () => {
    const res1 = canonicalizeExtractedSkills(["REST APIs"]);
    const res2 = canonicalizeExtractedSkills(["REST API"]);
    // both should produce same canonical form
    expect(res1.skills).toEqual(res2.skills);
  });

  it("handles exact bad strings from docs/baseline", () => {
    const res = canonicalizeExtractedSkills([
      "Git/GitHub workflows",
      "unit, integration and end-to-end testing",
      "CI/CD pipelines",
    ]);
    expect(res.skills).toContain("git");
    expect(res.skills).toContain("github");
    expect(res.skills).toContain("ci/cd");
    expect(res.skills).toContain("unit testing");
    expect(res.skills).toContain("integration testing");
    expect(res.skills).toContain("end-to-end testing");
  });
});
