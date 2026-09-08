import { notFound } from "next/navigation";

import { FiledMatchPage } from "../FiledMatchPage";

export const metadata = { title: "Record" };

/** A position in a filed game: the board after this many moves. */
export default async function FiledPositionRoute({ params }: PageProps<"/history/[slug]/[id]/[move]">) {
  const { slug, id, move } = await params;
  if (!/^\d{1,4}$/.test(move)) notFound();
  return <FiledMatchPage slug={slug} id={id} move={Number(move)} />;
}
