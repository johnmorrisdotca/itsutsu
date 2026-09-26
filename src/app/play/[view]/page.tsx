import MyGamesPage, { metadata as pageMetadata } from "../page";
import { withTabFromPath } from "@/lib/ui/tabs";

/*
 * One of the page's tabs, as a path (`tabs.ts`): the same page, with the
 * segment handed to it. The page says not found for a tab it does not have.
 */
export const metadata = pageMetadata;
export const dynamic = "force-dynamic";

export default async function MyGamesPageTab({ params, searchParams }: PageProps<"/play/[view]">) {
  const { view } = await params;
  return MyGamesPage({ params: Promise.resolve({}), searchParams: withTabFromPath(view, searchParams) } as PageProps<"/play">);
}
