import { FiledMatchPage } from "./FiledMatchPage";

export const metadata = { title: "Record" };

/** A filed game: the replay, opened at the final position. */
export default async function FiledMatchRoute({ params }: PageProps<"/history/[id]">) {
  const { id } = await params;
  return <FiledMatchPage id={id} />;
}
