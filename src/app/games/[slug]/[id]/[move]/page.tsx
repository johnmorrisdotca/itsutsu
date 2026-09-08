import { notFound } from "next/navigation";

import { MatchPage } from "../MatchPage";

export const metadata = {
  title: "Match",
  robots: { index: false, follow: false },
};

/** A position in a match: the board after this many moves. */
export default async function PositionRoute({ params }: PageProps<"/games/[slug]/[id]/[move]">) {
  const { slug, id, move } = await params;
  if (!/^\d{1,4}$/.test(move)) notFound();
  return <MatchPage slug={slug} id={id} move={Number(move)} />;
}
