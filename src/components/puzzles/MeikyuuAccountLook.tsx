import { currentReader } from "@/lib/auth/currentReader";
import { meikyuuLookFor } from "@/lib/puzzles/server/meikyuuLook";

import { MeikyuuLookSeed } from "./MeikyuuLookSeed";

/** The page's one line for Meikyuu's colours: the account's choice, read with the member the page already has, handed to the store. Draws nothing. */
export async function MeikyuuAccountLook() {
  const [initial, reader] = await Promise.all([meikyuuLookFor(), currentReader()]);
  return <MeikyuuLookSeed initial={initial} saves={reader.hasAccount} />;
}
