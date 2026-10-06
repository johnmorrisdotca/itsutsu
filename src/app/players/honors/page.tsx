import PlayersPage, { generateMetadata as pageMetadata } from "../page";
import { withTabFromPath } from "@/lib/ui/tabs";

/*
 * Players' honors tab, as a path (`tabs.ts`). A folder of its own rather than a
 * `[view]` segment, because /players/[slug] already holds that level: this
 * name wins over a slug, and a member's address is their id, which never is it.
 */
export const generateMetadata = pageMetadata;
export const dynamic = "force-dynamic";

export default async function PlayersTab({ searchParams }: PageProps<"/players/honors">) {
  return PlayersPage({ params: Promise.resolve({}), searchParams: withTabFromPath("honors", searchParams) } as PageProps<"/players">);
}
