import { currentMemberId } from "@/lib/auth/currentSession";
import type { SolvedLevels } from "@/lib/puzzles/meikyuu/completion";
import { meikyuuSolvedBy } from "@/lib/puzzles/server/meikyuuRecords";

import { MeikyuuProgressLine } from "./MeikyuuProgressLine";

/**
 * A MEMBER'S PROGRESS THROUGH MEIKYUU, on its front door: the one read of the levels they have solved at every size
 * (`meikyuuSolvedBy`, indexed on the member and the kind), at request time and in a Suspense of its own, so the page around
 * it stays prerendered and a stranger's view costs no database read. One read for the whole page, never one a row.
 */
export async function MeikyuuFrontProgress() {
  const memberId = await currentMemberId();
  if (memberId === null) return <MeikyuuProgressLine />;
  const solved = await meikyuuSolvedBy(memberId);
  const account: SolvedLevels = Object.fromEntries(Object.entries(solved).map(([size, levels]) => [Number(size), Object.keys(levels).map(Number)]));
  return <MeikyuuProgressLine account={account} />;
}
