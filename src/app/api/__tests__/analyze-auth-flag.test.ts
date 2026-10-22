import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// The Master Profile is optional. With the flag off nothing about the
// database is touched, so the anonymous flow keeps working even when
// DATABASE_URL is not configured at all.
vi.mock("@/lib/auth", () => ({
  auth: async () => null,
  getAuth: () => ({
    auth: async () => null,
    handlers: { GET: () => new Response(null), POST: () => new Response(null) },
  }),
}));

const JD_PAYLOAD = {
  title: "Backend Engineer",
  company: "Acme",
  seniority: "mid",
  required_skills: ["TypeScript", "PostgreSQL"],
  preferred_skills: ["GraphQL"],
  responsibilities: ["Build services"],
  education_requirement: null,
  other_requirements: [],
};

const RESUME_PAYLOAD = {
  notes: [],
  name: "Ada Lovelace",
  contact: "",
  title: "Backend Engineer",
  summary: "Builds services with TypeScript and PostgreSQL.",
  skills: [],
  experience: [
    {
      title: "Engineer",
      company: "Acme",
      location: "",
      dates: "2024-01",
      bullets: ["Built services with TypeScript and PostgreSQL."],
    },
  ],
  projects: [],
  education: [],
  certifications: [],
};

function geminiResponse(payload: unknown) {
  return new Response(
    JSON.stringify({
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: JSON.stringify(payload) }] },
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function fetchMock() {
  return vi.fn(async (_input: unknown, init?: RequestInit) => {
    const body = typeof init?.body === "string" ? init.body : "";
    return geminiResponse(
      body.includes("extract structured requirements") ? JD_PAYLOAD : RESUME_PAYLOAD,
    );
  });
}

function analyzeRequest() {
  const form = new FormData();
  form.set(
    "jdText",
    `Backend engineer wanted. Required: TypeScript, PostgreSQL. ${Date.now()}`,
  );
  form.set(
    "resumeText",
    "Ada Lovelace, backend engineer. Built services with TypeScript and PostgreSQL.",
  );
  form.set("provider", "gemini");
  form.set("geminiKey", "test-key");
  return new Request("http://localhost/api/analyze", { method: "POST", body: form });
}

describe("ENABLE_AUTH flag", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", fetchMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.DATABASE_URL;
    delete process.env.ENABLE_AUTH;
  });

  it("analyzes without a session when the flag is off", async () => {
    process.env.ENABLE_AUTH = "false";
    delete process.env.DATABASE_URL;

    const { POST } = await import("@/app/api/analyze/route");
    const res = await POST(analyzeRequest() as never);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { atsScoreBefore: number };
    expect(typeof body.atsScoreBefore).toBe("number");
  });

  it("rejects an anonymous analysis when the flag is on", async () => {
    process.env.ENABLE_AUTH = "true";
    delete process.env.DATABASE_URL;

    const { POST } = await import("@/app/api/analyze/route");
    const res = await POST(analyzeRequest() as never);

    expect(res.status).toBe(401);
  });

  it("hides the auth endpoints when the flag is off", async () => {
    process.env.ENABLE_AUTH = "false";
    delete process.env.DATABASE_URL;

    const { GET } = await import("@/app/api/auth/[...nextauth]/route");
    const res = await GET(new NextRequest("http://localhost/api/auth/session"));
    expect(res.status).toBe(404);
  });

  it("reports the flag through the status route", async () => {
    process.env.ENABLE_AUTH = "true";
    const { GET } = await import("@/app/api/auth/status/route");
    const res = await GET();
    const body = (await res.json()) as { enabled: boolean };

    expect(body.enabled).toBe(true);
  });
});
