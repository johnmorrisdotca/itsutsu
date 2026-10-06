import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the casual.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer agent's pass (`review`), the same shape the
 * drafted dictionary's own rows take.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_CASUAL: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // How many levels, in a line
  "casual.levels.one": {
    text: "{count}レベル",
    back: "{count} level",
    review: AGENT_READ,
  },
  "casual.levels.other": {
    text: "{count}レベル",
    back: "{count} levels",
    review: AGENT_READ,
  },
  "casual.stories.one": {
    text: "{count}話",
    back: "{count} story",
    review: AGENT_READ,
  },
  "casual.stories.other": {
    text: "{count}話",
    back: "{count} stories",
    review: AGENT_READ,
  },
  "casual.offered": {
    text: "{levels}を、1人で遊べます。",
    back: "{levels}, to play alone.",
    review: AGENT_READ,
  },
  "casual.boardLine": {
    text: "{levels}あります。{board}",
    back: "There are {levels}. {board}",
    review: AGENT_READ,
  },
  "casual.line": {
    text: "1人で遊べる{levels}。評価はなく、このブラウザーに保存されます。",
    back: "{levels} to play alone. They are not rated, and are kept in this browser.",
    review: AGENT_READ,
  },
  "casual.source": {
    text: "Itsutsuでは、1人で遊び、評価はなく、得点もつきません",
    back: "On Itsutsu you play alone, it is not rated, and it earns no points",
    review: AGENT_READ,
  },
  "casual.levelOf": {
    text: "{word}{level}（全{total}）",
    back: "{word} {level} of {total}",
    review: AGENT_READ,
  },
  "casual.crumbLevel": {
    text: "{word}{level}",
    back: "{word} {level}",
    review: AGENT_READ,
  },
  "casual.cardGoing": {
    text: "{word}{level}は{going}",
    back: "{word} {level} is {going}",
    review: AGENT_READ,
  },
  "casual.familyLine": {
    text: "{count}。どれも1レベル1〜2分ほど、1人で遊びます。評価も得点もなく、クリアしたレベルはこのブラウザーに保存されます。",
    back: "{count}. Each takes a minute or two a level, played alone. Nothing is rated or scored, and the levels you clear are kept in this browser.",
    review: AGENT_READ,
  },
  // What the rules page says about the house
  "casual.house.alone": {
    text: "1人で、指かマウスで遊びます。スマートフォンでもパソコンでも同じです。評価はなく、レベルをクリアしても得点も経験値もつきません。",
    back: "Played alone, with a finger or the mouse, the same on a phone or a computer. Nothing is rated, and clearing a level earns no points and no experience.",
    review: AGENT_READ,
  },
  "casual.house.kept": {
    text: "進み具合（ゲームごとにクリアしたレベルと、挑戦中のレベル）は、遊んでいるブラウザーにだけ保存されます。サイトのデータを消すと最初からになり、ほかの端末には引き継がれません。",
    back: "Your progress (the levels cleared in each game, and the level you were on) is saved only in the browser you play in. If you clear the site's data it starts again, and it does not carry over to other devices.",
    review: AGENT_READ,
  },
  "casual.house.physics": {
    text: "物理演算はKarakuriパッケージのもので、ブラウザーの中で1ステップを60分の1秒に固定して動きます。ランダムな要素はないので、レベルはいつでも、どの端末でも同じように進みます。",
    back: "The physics is the Karakuri package's own and runs in your browser with each step fixed at a sixtieth of a second. Nothing in it is random, so a level plays the same way every time and on every device.",
    review: AGENT_READ,
  },
  "casual.house.solved": {
    text: "どのレベルもクリアできます。採用する前に、探索か実際のプレイで、クリアできることを確かめてあります。",
    back: "Every level can be cleared. Before one was kept, it was checked by a search or by playing it through.",
    review: AGENT_READ,
  },
  "casual.house.restart": {
    text: "「やり直す」はレベルを最初からやり直します。「あきらめる」は未クリアのまま終わります。「新規対局」はレベルを選ぶ画面に戻り、挑戦中のレベルはそのまま残ります。",
    back: "\"Restart\" starts the level again. \"Give up\" ends it uncleared. \"New game\" goes back to the choice of level and leaves the level you were on as it is.",
    review: AGENT_READ,
  },
};
