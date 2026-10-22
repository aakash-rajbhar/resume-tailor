import { describe, expect, it } from "vitest";

import { normalizeDrafts } from "@/lib/profile/drafts";

/**
 * The drafts are the model's output after the code has tidied it: strings
 * trimmed, empty entries dropped, dates parsed and the lists sorted. Nothing
 * here is a fact until the user accepts it.
 */

describe("normalizeDrafts", () => {
  it("trims the text and drops the empty entries", () => {
    const drafts = normalizeDrafts({
      summary: {
        headline: "  Backend engineer  ",
        summary: " Builds payment services. ",
        location: " Bengaluru ",
      },
      experience: {
        items: [
          {
            company: "  Acme ",
            title: "Engineer",
            location: "",
            startDate: "Jan 2021",
            endDate: "Present",
            isCurrent: false,
            bullets: ["  Built the billing service.  ", "   "],
          },
          { company: "", title: "", location: "", startDate: "", endDate: "", isCurrent: false, bullets: [] },
        ],
      },
      projects: { items: [] },
      skills: { items: [] },
      education: { items: [] },
      certifications: { items: [] },
    });

    expect(drafts.summary.headline).toBe("Backend engineer");
    expect(drafts.summary.location).toBe("Bengaluru");
    expect(drafts.experience).toHaveLength(1);
    expect(drafts.experience[0].company).toBe("Acme");
    expect(drafts.experience[0].bullets).toEqual(["Built the billing service."]);
  });

  it("reads the dates and reports a current role", () => {
    const drafts = normalizeDrafts({
      summary: { headline: "", summary: "", location: "" },
      experience: {
        items: [
          {
            company: "Acme",
            title: "Engineer",
            location: "",
            startDate: "Jan 2021",
            endDate: "Present",
            isCurrent: false,
            bullets: [],
          },
        ],
      },
      projects: { items: [] },
      skills: { items: [] },
      education: { items: [] },
      certifications: { items: [] },
    });

    const role = drafts.experience[0];
    expect(role.startDate.iso).toBe("2021-01");
    expect(role.startDate.yearOnly).toBe(false);
    expect(role.endDate.isCurrent).toBe(true);
    expect(role.isCurrent).toBe(true);
  });

  it("sorts the roles by the start date, newest first", () => {
    const drafts = normalizeDrafts({
      summary: { headline: "", summary: "", location: "" },
      experience: {
        items: [
          {
            company: "Old Co",
            title: "Engineer",
            location: "",
            startDate: "2019",
            endDate: "2020",
            isCurrent: false,
            bullets: [],
          },
          {
            company: "New Co",
            title: "Engineer",
            location: "",
            startDate: "2023-04",
            endDate: "Present",
            isCurrent: true,
            bullets: [],
          },
        ],
      },
      projects: { items: [] },
      skills: { items: [] },
      education: { items: [] },
      certifications: { items: [] },
    });

    expect(drafts.experience.map((role) => role.company)).toEqual([
      "New Co",
      "Old Co",
    ]);
  });

  it("drops a duplicate skill and sorts the rest by name", () => {
    const drafts = normalizeDrafts({
      summary: { headline: "", summary: "", location: "" },
      experience: { items: [] },
      projects: { items: [] },
      skills: {
        items: [
          { name: "TypeScript", groupLabel: "Languages" },
          { name: "typescript", groupLabel: "Languages" },
          { name: "React", groupLabel: "Frontend" },
          { name: "  ", groupLabel: "" },
        ],
      },
      education: { items: [] },
      certifications: { items: [] },
    });

    expect(drafts.skills.map((skill) => skill.name)).toEqual(["React", "TypeScript"]);
  });

  it("gives every draft its own id", () => {
    const drafts = normalizeDrafts({
      summary: { headline: "", summary: "", location: "" },
      experience: {
        items: [
          {
            company: "Acme",
            title: "Engineer",
            location: "",
            startDate: "2021",
            endDate: "",
            isCurrent: false,
            bullets: [],
          },
          {
            company: "Globex",
            title: "Engineer",
            location: "",
            startDate: "2022",
            endDate: "",
            isCurrent: false,
            bullets: [],
          },
        ],
      },
      projects: { items: [] },
      skills: { items: [] },
      education: { items: [] },
      certifications: { items: [] },
    });

    const ids = drafts.experience.map((role) => role.draftId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
