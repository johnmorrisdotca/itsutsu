import PlayersPage, { metadata as pageMetadata } from "../page";
import { withTabFromPath } from "@/lib/ui/tabs";

/*
 * Players' bots tab, as a path (`tabs.ts`). A folder of its own rather than a
 * `[view]` segment, because /players/[slug] already holds that level: this
 * name wins over a slug, and a member's address is their id, which never is it.
 */
export const metadata = pageMetadata;
export const dynamic = "force-dynamic";

export default async function PlayersTab({ searchParams }: PageProps<"/players/bots">) {
  return PlayersPage({ params: Promise.resolve({}), searchParams: withTabFromPath("bots", searchParams) } as PageProps<"/players">);
}
