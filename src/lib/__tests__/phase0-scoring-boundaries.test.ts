import { describe, expect, it } from "vitest";
import { computeScore } from "@/lib/score";
import { normalizeForMatch } from "@/lib/skills/synonyms";

describe("computeScore word boundaries", () => {
  it("does NOT match 'java' when text only contains 'javascript'", () => {
    const result = computeScore({ required: ["Java"], preferred: [] }, "I know JavaScript every day");
    expect(result.matched).not.toContain("Java");
    expect(result.missing).toContain("Java");
    expect(result.score).toBe(0);
  });

  it("matches Java as a standalone word", () => {
    const result = computeScore({ required: ["Java"], preferred: [] }, "Java developer with Spring");
    expect(result.matched).toContain("Java");
    expect(result.score).toBe(100);
  });
});

describe("computeScore protected tokens", () => {
  it("protects c#", () => {
    const normalized = normalizeForMatch("Experienced in C# and .NET Core");
    expect(normalized).toContain("csharp");
    const result = computeScore({ required: ["C#"], preferred: [] }, "Experienced in C# development");
    expect(result.matched.length).toBe(1);
  });

  it("protects .net", () => {
    const normalized = normalizeForMatch("Building with .NET 6");
    expect(normalized).toContain("dotnet");
    const result = computeScore({ required: [".NET"], preferred: [] }, "Experienced with .NET Core");
    expect(result.matched.length).toBe(1);
  });

  it("protects node.js", () => {
    const normalized = normalizeForMatch("Using Node.js and npm");
    expect(normalized).toContain("nodejs");
    const result = computeScore({ required: ["Node.js"], preferred: [] }, "Node.js backend services");
    expect(result.matched.length).toBe(1);
  });

  it("protects c++", () => {
    const normalized = normalizeForMatch("Wrote C++ code");
    expect(normalized).toContain("cplusplus");
    const result = computeScore({ required: ["C++"], preferred: [] }, "Proficient in C++");
    expect(result.matched.length).toBe(1);
  });
});

describe("computeScore aliases", () => {
  it("matches k8s to kubernetes", () => {
    const result = computeScore({ required: ["Kubernetes"], preferred: [] }, "Deployed on k8s clusters");
    expect(result.matched).toContain("Kubernetes");
    expect(result.score).toBe(100);
  });

  it("matches postgres to postgresql", () => {
    const result = computeScore({ required: ["PostgreSQL"], preferred: [] }, "Worked with postgres databases");
    expect(result.matched).toContain("PostgreSQL");
    expect(result.score).toBe(100);
  });

  it("matches javascript/js", () => {
    const result = computeScore({ required: ["JavaScript"], preferred: [] }, "Built with JS and ES6");
    expect(result.matched).toContain("JavaScript");
    expect(result.score).toBe(100);
  });
});

describe("computeScore ordering and deduplication", () => {
  it("dedupes when same canonical skill appears twice", () => {
    const result = computeScore(
      { required: ["react", "React.js"], preferred: ["React"] },
      "React developer",
    );
    expect(result.matched.length).toBe(1);
  });

  it("returns sorted matched and missing arrays alphabetically", () => {
    const result = computeScore(
      { required: ["TypeScript", "React", "Node.js"], preferred: ["Docker", "Kubernetes"] },
      "React and Node.js experience",
    );
    expect(result.matched).toEqual(["Node.js", "React"]);
    expect(result.missing).toEqual(["Docker", "Kubernetes", "TypeScript"]);
  });
});

describe("computeScore edge cases", () => {
  it("handles empty required list", () => {
    const result = computeScore({ required: [], preferred: ["React"] }, "React developer");
    expect(result.score).toBe(100);
    expect(result.matched).toEqual(["React"]);
  });

  it("handles empty preferred list", () => {
    const result = computeScore({ required: ["React"], preferred: [] }, "React developer");
    expect(result.score).toBe(100);
    expect(result.missing).toEqual([]);
  });

  it("handles empty resume text", () => {
    const result = computeScore({ required: ["React"], preferred: ["Node.js"] }, "");
    expect(result.score).toBe(0);
    expect(result.matched).toEqual([]);
    expect(result.missing).toEqual(["Node.js", "React"]);
  });

  it("gives identical output regardless of input order", () => {
    const keywords1 = { required: ["TypeScript", "React"], preferred: ["Docker"] };
    const keywords2 = { required: ["React", "TypeScript"], preferred: ["Docker"] };
    const text1 = "React and TypeScript with Docker";
    const text2 = "Docker, TypeScript, React";
    const result1 = computeScore(keywords1, text1);
    const result2 = computeScore(keywords2, text2);
    expect(result1).toEqual(result2);
  });
});
