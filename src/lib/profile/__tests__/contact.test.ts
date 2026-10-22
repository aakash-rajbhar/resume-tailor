import { describe, expect, it } from "vitest";

import { extractContact, redactContact } from "@/lib/profile/contact";

/**
 * The contact extraction runs in code, before anything is sent to a model.
 * These tests pin the shapes that matter: the email, the phone, the links and
 * the name.
 */

describe("extractContact", () => {
  it("reads the email address", () => {
    const contact = extractContact(
      "Ada Lovelace\nada.lovelace@example.com\nBengaluru, India",
    );
    expect(contact.email).toBe("ada.lovelace@example.com");
  });

  it("reads the phone number", () => {
    const contact = extractContact("Phone: +91 98765 43210");
    expect(contact.phone).toBe("+91 98765 43210");
  });

  it("does not read a date as a phone number", () => {
    const contact = extractContact("Worked at Acme 03/2021 - 08/2023.");
    expect(contact.phone).toBeNull();
  });

  it("does not read a year range as a phone number", () => {
    const contact = extractContact("Employment 2019 2020 2021 2022");
    expect(contact.phone).toBeNull();
  });

  it("finds the links and tells them apart", () => {
    const contact = extractContact(
      [
        "Ada Lovelace",
        "https://github.com/ada",
        "https://linkedin.com/in/ada",
        "https://ada.dev",
        "ada@example.com",
      ].join("\n"),
    );

    expect(contact.githubUrl).toBe("https://github.com/ada");
    expect(contact.linkedinUrl).toBe("https://linkedin.com/in/ada");
    expect(contact.portfolioUrl).toBe("https://ada.dev");
    expect(contact.urls).toHaveLength(3);
  });

  it("does not treat a file name or a library as a link", () => {
    const contact = extractContact("Built with Node.js and README.md notes.");
    expect(contact.urls).toEqual([]);
    expect(contact.portfolioUrl).toBeNull();
  });

  it("reads the name from the header and skips the headings", () => {
    const contact = extractContact(
      ["EXPERIENCE", "Ada Lovelace", "ada@example.com"].join("\n"),
    );
    expect(contact.fullName).toBe("Ada Lovelace");
  });

  it("returns no name when the header holds nothing that looks like one", () => {
    const contact = extractContact("Summary\nEngineer with 5 years of experience.");
    expect(contact.fullName).toBeNull();
  });
});

describe("redactContact", () => {
  it("removes the email, the phone and the links from the text", () => {
    const { text, contact } = redactContact(
      [
        "Ada Lovelace",
        "ada@example.com",
        "+91 98765 43210",
        "https://github.com/ada",
        "",
        "Backend Engineer at Acme",
        "Built the billing service.",
      ].join("\n"),
    );

    expect(text).not.toContain("ada@example.com");
    expect(text).not.toContain("98765");
    expect(text).not.toContain("github.com/ada");
    expect(text).toContain("Backend Engineer at Acme");
    expect(text).toContain("Built the billing service.");

    expect(contact.email).toBe("ada@example.com");
    expect(contact.phone).toBe("+91 98765 43210");
    expect(contact.githubUrl).toBe("https://github.com/ada");
  });

  it("keeps the professional content and the dates", () => {
    const { text } = redactContact(
      "Backend Engineer at Acme from 03/2021 to Present. Used TypeScript.",
    );
    expect(text).toContain("Backend Engineer at Acme");
    expect(text).toContain("03/2021");
    expect(text).toContain("TypeScript");
  });
});
