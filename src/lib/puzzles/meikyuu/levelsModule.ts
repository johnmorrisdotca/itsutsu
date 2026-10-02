import { loadMeikyuuLevels, readMeikyuuLevelsWith } from "./levels";

/**
 * MEIKYUU'S LEVELS WHERE THERE IS NO BROWSER: the server's own checks and its
 * records of who solved which level (`server/meikyuuRecords.ts`), a unit test, a
 * browser spec's own process. Importing this module is what lets
 * `loadMeikyuuLevels` answer there (see `levels.ts`).
 */
readMeikyuuLevelsWith(() => import("@johnmorrisdotca/meikyuu/levels"));

/** The list, read from its module: `loadMeikyuuLevels` for a caller with no browser. */
export function loadMeikyuuLevelsFromModule(): Promise<void> {
  return loadMeikyuuLevels();
}
