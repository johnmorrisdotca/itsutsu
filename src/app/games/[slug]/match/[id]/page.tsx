import { MatchPage } from "./MatchPage";

export const metadata = {
  title: "Match",
  // A match page can be reached from a seat link; neither should be indexed.
  robots: { index: false, follow: false },
};

/** One match of a game, at one address: live while it is played, a replay once it is filed. */
export default async function MatchRoute({ params, searchParams }: PageProps<"/games/[slug]/match/[id]">) {
  const { slug, id } = await params;
  /*
   * `?seat=full` is how the seat link says it could not seat you. The claim
   * route cannot render a page — it is a route handler — so it sends the
   * reader here, to the match they were invited to, with the reason attached.
   * A bare redirect would land them as a spectator with nothing saying their
   * seat had not been taken, which is the failure that looks like success.
   */
  const seatFull = (await searchParams).seat === "full";
  return <MatchPage slug={slug} id={id} seatFull={seatFull} />;
}
