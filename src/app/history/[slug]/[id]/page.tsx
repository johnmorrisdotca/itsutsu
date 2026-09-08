import { FiledMatchPage } from "./FiledMatchPage";

export const metadata = { title: "Record" };

/** A filed game: the replay, opened at the final position. */
export default async function FiledMatchRoute({ params }: PageProps<"/history/[slug]/[id]">) {
  const { slug, id } = await params;
  return <FiledMatchPage slug={slug} id={id} />;
}
