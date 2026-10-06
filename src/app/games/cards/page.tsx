import GamesPage from "../page";
import { withTabFromPath } from "@/lib/ui/tabs";

/*
 * The games laid out as cards, a tab of /games as a path (`tabs.ts`). A folder of
 * its own rather than `[view]`, because /games/[slug] holds that level: this
 * name wins over a game's slug, and no game is called "cards".
 */
export { generateMetadata } from "../page";
export const dynamic = "force-dynamic";

export default async function GamesTab({ searchParams }: PageProps<"/games/cards">) {
  return GamesPage({ params: Promise.resolve({}), searchParams: withTabFromPath("cards", searchParams) } as PageProps<"/games">);
}
