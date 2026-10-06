import { HOUSEKI_CAMPAIGN_LIST, HOUSEKI_SPECS, levelsIn } from "./houseki.constants";
import type { HousekiCampaign, HousekiKind, HousekiRequest } from "./houseki.types";

type Query = Record<string, string | string[] | undefined>;

function one(query: Query, name: string): string | undefined {
  const raw = query[name];
  return Array.isArray(raw) ? raw[0] : raw;
}

/** A whole number in the query, or null for anything else. */
function whole(raw: string | undefined): number | null {
  return raw !== undefined && /^\d{1,3}$/.test(raw) ? Number(raw) : null;
}

/**
 * What a play address asks for, held to what the game has: `?level=7`
 * (`&campaign=shizen` for Colour Chains' other two), `?lesson=2`, `?daily=1`,
 * or `?free=1&size=wide&colours=5&mode=arcade`. Anything it cannot read, or
 * that the game does not offer (a level past its last, a Daily it has none
 * of), is the first level of the first campaign: an address is never a way to
 * ask for a board that does not exist.
 */
export function housekiRequestOf(kind: HousekiKind, query: Query): HousekiRequest {
  const spec = HOUSEKI_SPECS[kind];
  const first: HousekiRequest = { kind: "level", campaign: "classic", number: 1 };
  if (one(query, "daily") === "1") return spec.daily ? { kind: "daily" } : first;
  const lesson = whole(one(query, "lesson"));
  if (lesson !== null) return lesson >= 1 && lesson <= spec.lessons ? { kind: "lesson", number: lesson } : first;
  if (one(query, "free") === "1") {
    const size = spec.sizes.find((each) => each.id === one(query, "size")) ?? spec.sizes[0]!;
    const colours = spec.colours.find((each) => String(each) === one(query, "colours")) ?? spec.colours[0]!;
    return { kind: "free", size: size.id, colours, arcade: spec.arcade && one(query, "mode") === "arcade" };
  }
  const asked = HOUSEKI_CAMPAIGN_LIST.find((each) => each === one(query, "campaign")) ?? "classic";
  const campaign: HousekiCampaign = levelsIn(kind, asked) > 0 ? asked : "classic";
  const number = whole(one(query, "level"));
  return number !== null && number >= 1 && number <= levelsIn(kind, campaign) ? { kind: "level", campaign, number } : first;
}

/** The query that asks for a request: the inverse of `housekiRequestOf`, with the shortest spelling of each. */
export function housekiQuery(request: HousekiRequest): string {
  if (request.kind === "daily") return "?daily=1";
  if (request.kind === "lesson") return `?lesson=${request.number}`;
  if (request.kind === "free") return `?free=1&size=${request.size}&colours=${request.colours}${request.arcade ? "&mode=arcade" : ""}`;
  return request.campaign === "classic" ? `?level=${request.number}` : `?campaign=${request.campaign}&level=${request.number}`;
}

/** The same request, said as a key a kept run can be told by: one run of each kind of play is kept. */
export function housekiRequestKey(request: HousekiRequest): string {
  if (request.kind === "daily") return "daily";
  if (request.kind === "lesson") return `lesson:${request.number}`;
  if (request.kind === "free") return `free:${request.size}:${request.colours}:${request.arcade ? "arcade" : "relaxed"}`;
  return `level:${request.campaign}:${request.number}`;
}
