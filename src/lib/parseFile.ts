import mammoth from "mammoth";

// Polyfill DOMMatrix for pdfjs-dist (required in Node.js/Vercel serverless)
if (typeof globalThis.DOMMatrix !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const domMatrixModule = require("dommatrix");
  
  // Handle CommonJS, ES Module interop (.default), and direct module exports
  const DOMMatrixConstructor = typeof domMatrixModule === "function"
    ? domMatrixModule
    : (domMatrixModule.default || domMatrixModule.DOMMatrix || domMatrixModule);

  if (typeof DOMMatrixConstructor === "function") {
    globalThis.DOMMatrix = DOMMatrixConstructor as any;
  } else {
    console.error("DOMMatrix polyfill failed: resolved module is not a constructor function", domMatrixModule);
  }
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
    
    // Configure pdfjs-dist worker dynamically to avoid module evaluation issues
    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.mjs";
      }
    } catch {
      // Worker config is optional - pdf-parse may handle it internally
    }

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