import { describe, expect, it, vi, beforeEach } from "vitest";
import { generateJSON } from "@/lib/ai";
import { z } from "zod";

const schema = z.object({ name: z.string(), ok: z.boolean() });

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("generateJSON with mocked fetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed data for valid response", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        candidates: [{ finishReason: "STOP", content: { parts: [{ text: '{"name":"test","ok":true}' }] } }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateJSON({
      system: "system",
      user: "user",
      schema,
      provider: "gemini",
      config: { geminiKey: "test-key" },
    });

    expect(result.data).toEqual({ name: "test", ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries once with validation error appended on invalid response then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          candidates: [{ finishReason: "STOP", content: { parts: [{ text: '{"name":"test"}' }] } }],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          candidates: [{ finishReason: "STOP", content: { parts: [{ text: '{"name":"test","ok":true}' }] } }],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateJSON({
      system: "system",
      user: "user",
      schema,
      provider: "gemini",
      config: { geminiKey: "test-key" },
    });

    expect(result.data).toEqual({ name: "test", ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondCall = fetchMock.mock.calls[1];
    const body = JSON.parse(secondCall[1].body as string);
    expect(body.contents[0].parts[0].text).toContain("VALIDATION ERROR");
  });

  it("invalid twice returns a typed error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          candidates: [{ finishReason: "STOP", content: { parts: [{ text: '{"name":"test"}' }] } }],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          candidates: [{ finishReason: "STOP", content: { parts: [{ text: '{"name":"bad"}' }] } }],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      generateJSON({
        system: "system",
        user: "user",
        schema,
        provider: "gemini",
        config: { geminiKey: "test-key" },
      }),
    ).rejects.toMatchObject({
      name: "AIValidationError",
      details: expect.any(String),
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
