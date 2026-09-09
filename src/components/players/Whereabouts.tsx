import { localTimeIn } from "@/lib/social/presence";

/**
 * The city somebody is in, and what time it is there.
 *
 * The profile form told members that "city, country and the time where you
 * are show beside your name on the players page". None of the three did. The
 * country was the half John noticed; the city and the clock were stored and
 * read by nothing at all except a buddy list, which most people never see.
 *
 * The clock is the one that earns its place on a turn-based site. A game here
 * takes a week, and knowing it is four in the morning where your opponent is
 * turns a slow reply from a slight into a person who is asleep.
 */
export function Whereabouts({
  city,
  timeZone,
}: {
  city: string | null | undefined;
  timeZone: string | null | undefined;
}) {
  const where = (city ?? "").trim();
  // The country is already said beside the name, so it is not repeated here —
  // this line is the city, and the time, and nothing anybody has read already.
  const time = localTimeIn((timeZone ?? "").trim());
  if (where === "" && time === null) return null;

  return (
    <p className="text-xs text-muted" data-testid="whereabouts">
      {where !== "" ? <span data-testid="whereabouts-city">{where}</span> : null}
      {where !== "" && time !== null ? " · " : null}
      {time !== null ? (
        <span data-testid="whereabouts-time">{time} where they are</span>
      ) : null}
    </p>
  );
}
