import { loadMeikyuuLevelsFor, readMeikyuuLevelsWith } from "./levels";

/**
 * MEIKYUU'S LEVELS WHERE THERE IS NO BROWSER: the server's own checks and its
 * records of who solved which level (`server/meikyuuRecords.ts`), a unit test, a
 * browser spec's own process. Importing this module is what lets
 * `loadMeikyuuLevels` answer there (see `levels.ts`).
 */
readMeikyuuLevelsWith(
  () => import("@johnmorrisdotca/meikyuu/levels"),
  () => import("@johnmorrisdotca/meikyuu/levels/tall"),
  () => import("@johnmorrisdotca/meikyuu/levels/colossal"),
  () => import("@johnmorrisdotca/meikyuu/3d/levels/recipes"),
);

/**
 * The lists the given sizes are in, read from their modules: for a caller with no browser, which names the level a solve
 * was and who is fastest. A size of the four reads the first list (60 KB), a tall size the second (96 KB) and a colossal one the third (17 KB) and a solid's the recipes alone (50 KB, for all 5,760 levels of the eighteen solids); a page asks
 * only for the sizes it has to say something of, so a square level's page never reads the tall list.
 */
export async function loadMeikyuuLevelsFromModule(sizes: readonly number[]): Promise<void> {
  await Promise.all(sizes.map((size) => loadMeikyuuLevelsFor(size)));
}
