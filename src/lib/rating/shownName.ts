import { BOT_MEMBER_LIST } from "@/lib/bots/bots.constants";

import { playerKey } from "./playerKey";

/**
 * The name this site PRINTS for somebody, which is not always the name it
 * knows them by.
 *
 * John's twelve-year-old daughter signed up and the site put her full name on
 * the board, in the record, and in every list on it. His words: "We shouldn't
 * show her full name. Just her first name I think."
 *
 * So a person is shown by their first name and the initial of the rest:
 * "Hanako M." Everything underneath is untouched — the ratings are keyed by the full name, the record stores the
 * names the game was played under, and a link still goes to the same page.
 * This is about what is on the screen.
 *
 * BE CLEAR ABOUT WHAT THIS DOES NOT DO. The full name is still in the address
 * of a player's page, and still in the record of a game they played. Anybody
 * who wants it can read it. John raised addressing people by id instead, and
 * said in the same breath that it needed deciding rather than assuming —
 * every player address here is a name and the ratings are keyed by one, so
 * that is a change to make on purpose and not as a side effect of this. Until
 * then this is a smaller thing honestly: a name is not on display everywhere.
 *
 * WHY NOT THE FIRST NAME ALONE, which is what was asked for. Because a ladder
 * is a ranking and a ranking has to have rows you can tell apart. Built that
 * way first, the ladder read "Sora, Kaya, Again, Sora, Sweep, Sora" — several
 * different people, identical on screen, in the one list whose whole job is
 * to say who is who. An initial is what a school register or a club ladder
 * uses for the same reason, and it protects the part that identifies somebody:
 * the surname is what turns a first name into a person you can look up.
 *
 * If John wants the first name bare, it is the one line below and nothing else
 * changes — every caller and every test asks this function rather than
 * spelling the rule out.
 *
 * The computer players keep theirs. There is nobody behind Hidemasa Tamenoki
 * to protect, the full name is the character, and cutting it to "Hidemasa"
 * would take something real away for a reason that does not apply.
 */
const PROGRAMS = new Set(BOT_MEMBER_LIST.map((bot) => playerKey(bot.name)));

export function shownName(name: string): string {
  const whole = name.trim();
  if (whole === "") return whole;
  if (PROGRAMS.has(playerKey(whole))) return whole;
  /*
   * Split on spaces only. A hyphenated or apostrophised name is ONE name —
   * Anne-Marie and O'Connor are not two — and breaking those would be a
   * different way of getting somebody's name wrong.
   */
  const parts = whole.split(/\s+/);
  const first = parts[0] ?? whole;
  const rest = parts.slice(1).filter((part) => part !== "");
  if (rest.length === 0) return first;
  // The initial of whatever follows, which is usually the surname and is
  // sometimes a middle name. Either way it is enough to tell two people apart
  // and not enough to look either of them up.
  const initial = [...(rest[rest.length - 1] ?? "")][0] ?? "";
  return initial === "" ? first : `${first} ${initial.toUpperCase()}.`;
}
