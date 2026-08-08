import mammoth from "mammoth";

// Polyfill DOMMatrix for pdfjs-dist (required in Node.js/Vercel serverless)
if (typeof globalThis.DOMMatrix === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const DOMMatrix = require("dommatrix");
  globalThis.DOMMatrix = DOMMatrix as any;
}

/** Extracts plain text from an uploaded resume file (.docx, .pdf, or .txt). */
export async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  if (name.endsWith(".pdf")) {
    // pdf-parse v2 uses a class-based API: new PDFParse({ data }).getText()
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  // .txt or anything else — treat as plain text
  return buffer.toString("utf-8");
}