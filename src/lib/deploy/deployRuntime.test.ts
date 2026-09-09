import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The database client is built for the machine that will run it.
 *
 * This one cost a live site. The deploy workflow runs `vercel build` on a
 * GitHub runner and then ships that output with `vercel deploy --prebuilt`,
 * so `prisma generate` runs on Ubuntu — and Vercel's functions do not run on
 * Ubuntu. Prisma had generated a query engine for debian-openssl-3.0.x and
 * the runtime asked for rhel-openssl-3.0.x, so every page that touched the
 * database threw and every page that did not carried on working perfectly,
 * which is a maddening thing to look at.
 *
 * It had been wrong in the workflow since the day it was written and never
 * fired, because every deploy until then was done by hand — and a plain
 * `vercel deploy` uploads the source for Vercel to build on its own
 * machines, which generate the right engine without being asked. The site
 * broke the first time the pipeline actually worked.
 *
 * So the two files have to agree, and nothing else checks that they do: the
 * type system cannot see a schema, and a green test suite on somebody's
 * laptop proves only that the client works on that laptop. This is the only
 * place the agreement is written down.
 */

/** Vercel's Node functions run on Amazon Linux, which Prisma calls this. */
const VERCEL_RUNTIME = "rhel-openssl-3.0.x";

function read(path: string): string {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

describe("the deployed database client", () => {
  it("is generated for Vercel's runtime as well as for ours", () => {
    const schema = read("prisma/schema.prisma");
    const targets = /binaryTargets\s*=\s*\[([^\]]*)\]/.exec(schema)?.[1] ?? "";

    expect(targets, "prisma/schema.prisma declares no binaryTargets").not.toBe("");
    // "native" keeps a developer's own machine working; the other is the one
    // that matters in production and the one that was missing.
    expect(targets).toContain("native");
    expect(targets, `the generator must name ${VERCEL_RUNTIME}`).toContain(VERCEL_RUNTIME);
  });

  it("carries the engine into the function that needs it", () => {
    /*
     * Naming the target was necessary and not sufficient, which is the part
     * that cost the second hour. The engine is a native binary Prisma finds
     * by a path lookup at runtime rather than by an import, so Next's file
     * tracing cannot see it and leaves it out of the deployed function
     * however many targets were generated. The symptom is identical either
     * way — a database client with no engine — so both halves are checked
     * here, and neither is any use alone.
     */
    const config = read("next.config.ts");
    const traced = /outputFileTracingIncludes\s*:\s*\{([\s\S]*?)\n  \}/.exec(config)?.[1] ?? "";
    expect(traced, "next.config.ts traces no files at all").not.toBe("");
    expect(traced, "the Prisma engine is not traced into the deployed function").toContain(
      ".prisma/client",
    );
  });

  it("still ships output built somewhere other than where it runs", () => {
    /*
     * The reason the check above is needed at all. If the deploy ever stops
     * shipping prebuilt output — if it goes back to letting Vercel build the
     * source itself — then Prisma generates on the machine that will run it
     * and the target list stops mattering. This test is here so that whoever
     * makes that change finds the note rather than a mystery.
     */
    const workflow = read(".github/workflows/vercel-deploy.yml");
    expect(workflow).toContain("vercel deploy --prebuilt");
    expect(workflow, "the build runs on a GitHub runner, not on Vercel").toMatch(
      /runs-on:\s*ubuntu-latest/,
    );
  });
});
