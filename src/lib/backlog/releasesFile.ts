import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { parseReleases, type Release } from "./releases";

/**
 * CHANGELOG.md as the server can read it.
 *
 * The file is read at request time rather than baked in, so a release added
 * after a deployment still shows without a rebuild. Next only ships the files
 * it can see being used, so `outputFileTracingIncludes` in next.config.ts names
 * this one for the pages that read it.
 *
 * A changelog that cannot be read is not worth a 500: the page says the
 * history is unavailable and still shows the board, which is the half nobody
 * else keeps.
 */
export async function readReleases(limit = 0): Promise<Release[]> {
  try {
    const markdown = await readFile(join(process.cwd(), "CHANGELOG.md"), "utf8");
    const releases = parseReleases(markdown);
    return limit > 0 ? releases.slice(0, limit) : releases;
  } catch (error) {
    console.error(error);
    return [];
  }
}
