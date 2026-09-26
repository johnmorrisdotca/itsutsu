import PlayerPage, { metadata as pageMetadata } from "../page";
import { withTabFromPath } from "@/lib/ui/tabs";

/*
 * One chapter of a player's page as a path (`tabs.ts`): /players/<id>/goldtoken,
 * /players/<id>/xp. The same page, with the segment handed to it; it says not
 * found for a chapter this player does not have.
 */
export const metadata = pageMetadata;

export default async function PlayerChapter({ params, searchParams }: PageProps<"/players/[slug]/[view]">) {
  const { slug, view } = await params;
  return PlayerPage({ params: Promise.resolve({ slug }), searchParams: withTabFromPath(view, searchParams) } as PageProps<"/players/[slug]">);
}
