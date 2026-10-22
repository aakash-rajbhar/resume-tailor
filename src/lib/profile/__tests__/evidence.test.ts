import { describe, expect, it } from "vitest";

import {
  evidenceTextOf,
  matchSkillEvidence,
  type EvidenceCandidate,
} from "@/lib/profile/evidence";

/**
 * Evidence is matched in code. A skill counts as evidenced when a role or a
 * project mentions it, including the surface forms from the alias map.
 */

const candidates: EvidenceCandidate[] = [
  {
    kind: "experience",
    refId: "role-1",
    label: "Backend Engineer at Acme",
    text: "Backend Engineer at Acme. Built the billing service with TypeScript.",
  },
  {
    kind: "project",
    refId: "project-1",
    label: "Ledger",
    text: "A double entry ledger written in React.js and Postgres.",
  },
];

describe("matchSkillEvidence", () => {
  it("matches the exact skill name", () => {
    const refs = matchSkillEvidence("TypeScript", candidates);
    expect(refs).toHaveLength(1);
    expect(refs[0].kind).toBe("experience");
    expect(refs[0].refId).toBe("role-1");
    expect(refs[0].note).toBe("Backend Engineer at Acme");
  });

  it("matches the surface forms from the alias map", () => {
    const refs = matchSkillEvidence("React", candidates);
    expect(refs.map((ref) => ref.refId)).toEqual(["project-1"]);
  });

  it("matches a plural", () => {
    const refs = matchSkillEvidence(
      "PostgreSQL",
      [
        {
          kind: "experience",
          refId: "role-2",
          label: "Role",
          text: "Migrated the PostgreSQL databases.",
        },
      ],
    );
    expect(refs).toHaveLength(1);
  });

  it("finds nothing when the text never mentions the skill", () => {
    expect(matchSkillEvidence("Rust", candidates)).toEqual([]);
  });

  it("does not match a skill that is only a prefix of a word", () => {
    const refs = matchSkillEvidence("Go", [
      { kind: "experience", refId: "role-3", label: "Role", text: "Wrote a good deployment guide." },
    ]);
    expect(refs).toEqual([]);
  });

  it("returns nothing for an empty skill name", () => {
    expect(matchSkillEvidence("", candidates)).toEqual([]);
  });
});

describe("evidenceTextOf", () => {
  it("joins the title, the bullets and the tools", () => {
    const text = evidenceTextOf({
      title: "Backend Engineer",
      company: "Acme",
      bullets: ["Built the billing service."],
      tools: ["TypeScript"],
    });

    expect(text).toContain("Backend Engineer");
    expect(text).toContain("Acme");
    expect(text).toContain("Built the billing service.");
    expect(text).toContain("TypeScript");
  });

  it("ignores the parts that are not there", () => {
    const text = evidenceTextOf({ title: null, bullets: "not an array" });
    expect(text).toBe("");
  });
});
