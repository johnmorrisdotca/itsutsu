import { gameArtPath } from "@/lib/gomoku/artwork";
import type { Speaker } from "@/lib/i18n/i18n";
import type { RulesPage } from "@/lib/learn/rulesPage";
import { casualCopy } from "@/lib/party/partyCopy";

import { CASUAL_SPECS } from "./casual.constants";
import type { CasualKind } from "./casual.types";

/** "5 levels" or "4 stories", from the game's own spec; 5レベル and 4話 for a reader of Japanese. */
export function casualLevelsWords(kind: CasualKind, say: Speaker): string {
  const { levels } = CASUAL_SPECS[kind];
  return say.count(kind === "choiceStory" ? "casual.stories" : "casual.levels", levels);
}

/**
 * A casual game's rules page, in the game template: Object, Board, Play,
 * House. The same `RulesPage` shape every game builds, so the one rules page
 * draws it and a reader who has read one has read them all. The facts come
 * from the game's copy and spec, never from a second description that could
 * drift. Its words are the reader's language's (`casualCopy`, and the house lines' phrases).
 */
export function casualRulesPage(kind: CasualKind, say: Speaker): RulesPage {
  const copy = casualCopy(kind, say.locale);
  const spec = CASUAL_SPECS[kind];
  return {
    variant: kind,
    title: copy.label,
    kanji: copy.kanji,
    tagline: copy.tagline,
    origin: copy.origin,
    alsoKnownAs: [],
    from: null,
    wikipedia: null,
    object: [copy.tagline, copy.rules[0]],
    board: [say.say("casual.boardLine", { levels: casualLevelsWords(kind, say), board: copy.board })],
    play: copy.rules.slice(1),
    house: [say.say("casual.house.alone"), say.say("casual.house.kept"), say.say(spec.physics ? "casual.house.physics" : "casual.house.solved"), say.say("casual.house.restart")],
    image: gameArtPath(kind),
  };
}
