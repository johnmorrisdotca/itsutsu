import { MatchPage } from "./MatchPage";

export const metadata = {
  title: "Match",
  // A match page can be reached from a seat link; neither should be indexed.
  robots: { index: false, follow: false },
};

/** One match of a game, at one address: live while it is played, a replay once it is filed. */
export default async function MatchRoute({ params }: PageProps<"/games/[slug]/match/[id]">) {
  const { slug, id } = await params;
  return <MatchPage slug={slug} id={id} />;
}
