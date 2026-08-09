import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "pdf-parse"],
  outputFileTracingIncludes: {
    "/api/analyze": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
};

export default nextConfig;