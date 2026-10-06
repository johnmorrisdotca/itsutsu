import { notFound } from "next/navigation";

import { currentSpeaker } from "@/lib/i18n/currentLocale";

import { MatchPage } from "../MatchPage";

export async function generateMetadata() {
  return { title: (await currentSpeaker()).say("gamepages.game"), robots: { index: false, follow: false } };
}

/** A position in a match: the board after this many moves. */
export default async function PositionRoute({ params }: PageProps<"/games/[slug]/match/[id]/[move]">) {
  const { slug, id, move } = await params;
  if (!/^\d{1,4}$/.test(move)) notFound();
  return <MatchPage slug={slug} id={id} move={Number(move)} />;
}
