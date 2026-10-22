import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Route handlers must go through the scoped data-access functions so the
  // ownership checks cannot be skipped.
  {
    files: ["src/app/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "drizzle-orm",
              message:
                "Route handlers must use the scoped data-access functions in @/db/repo.",
            },
            {
              name: "@/db/schema",
              message:
                "Route handlers must use the scoped data-access functions in @/db/repo.",
            },
            {
              name: "@/db/client",
              message:
                "Route handlers must use the scoped data-access functions in @/db/repo.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
