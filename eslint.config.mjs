import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  /*
   * ONE LINK, WITH PREFETCHING OFF BY DEFAULT: `src/components/ui/Link.tsx`.
   * Next's own prefetches every link in view, and on this site each one is a
   * server request nobody asked for (about twenty a page view, 2026-09-26).
   */
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/Link.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [{ name: "next/link", message: "Import Link from \"@/components/ui/Link\", which leaves prefetching off unless a link asks for it." }] },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    // Build output anywhere, including a sibling agent's worktree under .claude/.
    "**/.next/**",
    ".claude/**",
    /*
     * Whatever `vercel build` leaves behind. It is generated, gitignored and
     * never linted on CI, which is why nobody saw it — but a hand-deploy run
     * from this checkout drops it here, and the next `pnpm lint` then reports
     * thousands of problems in minified output and buries the real ones.
     */
    ".vercel/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
