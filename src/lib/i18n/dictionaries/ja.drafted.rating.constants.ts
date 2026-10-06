import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the rating.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_RATING: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // A tier's note, beside its name
  "rating.tierUnratedNote": {
    text: "レーティング対局が4局に満たない状態です。",
    back: "Fewer than four rated games.",
    review: AGENT_READ,
  },
  "rating.tierProvisionalNote": {
    text: "まだ実力が定まっておらず、レーティングが大きく動きます。",
    back: "Its level is not settled yet, and the rating moves a lot.",
    review: AGENT_READ,
  },
  "rating.tierEstablishedNote": {
    text: "レーティング対局が20局以上あります。",
    back: "There are twenty or more rated games.",
    review: AGENT_READ,
  },
  // A run of results, for a hover note
  "rating.streakWon": {
    text: "{count}連勝。",
    back: "{count} wins in a row.",
    review: AGENT_READ,
  },
  "rating.streakLost": {
    text: "{count}連敗。",
    back: "{count} losses in a row.",
    review: AGENT_READ,
  },
  "rating.streakDrawn": {
    text: "{count}連続で引き分け。",
    back: "{count} draws in a row.",
    review: AGENT_READ,
  },
  // A game that cannot be rated: the verdict, then the reason
  "rating.refusedWord": {
    text: "レーティング対象外",
    back: "Not counted for rating",
    review: AGENT_READ,
  },
  "rating.willNotCount": {
    text: "この対局はレーティングに反映されません",
    back: "This game will not be reflected in ratings",
    review: AGENT_READ,
  },
  "rating.didNotCount": {
    text: "この対局はレーティングに反映されませんでした",
    back: "This game was not reflected in ratings",
    review: AGENT_READ,
  },
  "rating.refusalUnnamed": {
    text: "名前のない席があり、結果を記録する相手がいません。両方の席に名前があると、対局がレーティングに反映されます。",
    back: "A seat has no name, so there is nobody to record the result for. When both seats have a name, the game is reflected in ratings.",
    review: AGENT_READ,
  },
  "rating.refusalUnnamedShort": {
    text: "レーティング対象外（席に名前がありません）",
    back: "Not counted for rating (a seat has no name)",
    review: AGENT_READ,
  },
  "rating.refusalOnePlayer": {
    text: "両方の席が同じ対局者です。レーティングは2人を比べる数字ですが、ここには1人しかいません。対局はほかの対局と同じように記録され、再生もできますが、レーティングは動きません。",
    back: "Both seats are the same player. A rating is a number that compares two people, but there is only one person here. The game is recorded and can be replayed like any other, but no rating moves.",
    review: AGENT_READ,
  },
  "rating.refusalOnePlayerShort": {
    text: "レーティング対象外（対局者が1人）",
    back: "Not counted for rating (one player)",
    review: AGENT_READ,
  },
  "rating.refusalKeptRecord": {
    text: "どちらかの名前は、このサイトより前の記録として残されているもので、ここでは誰も使っていません。対局は記録されますが、順位表は変わりません。",
    back: "One of the names is a record kept from before this site, which nobody uses here. The game is recorded, but the standings do not change.",
    review: AGENT_READ,
  },
  "rating.refusalKeptRecordShort": {
    text: "レーティング対象外（残された記録の名前）",
    back: "Not counted for rating (the name of a kept record)",
    review: AGENT_READ,
  },
  "rating.refusalHotSeat": {
    text: "両方の席を1つの画面で打ったため、サインインからは2人を区別できません。レーティングは別々の2人のあいだでやりとりするものなので、1台で交代しながら打つ対局には反映できません。名前が2つあっても同じです。",
    back: "Both seats were played on one screen, so the two of you cannot be told apart from a sign-in. A rating is exchanged between two separate people, so it cannot be applied to a game played in turns on one device. It is the same even if there are two names.",
    review: AGENT_READ,
  },
  "rating.refusalHotSeatShort": {
    text: "レーティング対象外（1つの画面で対局）",
    back: "Not counted for rating (played on one screen)",
    review: AGENT_READ,
  },
  "rating.refusalHandicap": {
    text: "片方がハンデを受けているため、2人は同じ規則で打っていません。レーティングは対等な2人のあいだでやりとりするものなので、ハンデ戦には反映できません。対局はほかの対局と同じように記録され、再生もできますが、レーティングは動きません。",
    back: "One side has a handicap, so the two of you are not playing by the same rules. A rating is exchanged between two players on equal terms, so it cannot be applied to a handicap game. The game is recorded and can be replayed like any other, but no rating moves.",
    review: AGENT_READ,
  },
  "rating.refusalHandicapShort": {
    text: "レーティング対象外（ハンデ戦）",
    back: "Not counted for rating (a handicap game)",
    review: AGENT_READ,
  },
  "rating.refusalHeadStart": {
    text: "片方に先行があるため、2人は対等な条件で打っていません。レーティングは対等な2人のあいだでやりとりするものなので、先行のある対局には反映できません。対局はほかの対局と同じように記録され、再生もできますが、レーティングは動きません。",
    back: "One side has a head start, so the two of you are not playing on equal terms. A rating is exchanged between two players on equal terms, so it cannot be applied to a game with a head start. The game is recorded and can be replayed like any other, but no rating moves.",
    review: AGENT_READ,
  },
  "rating.refusalHeadStartShort": {
    text: "レーティング対象外（先行あり）",
    back: "Not counted for rating (with a head start)",
    review: AGENT_READ,
  },
};
