import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the cubemethod.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`). A step of the method is a 段階, as it is in
 * the learn.cube.* phrases beside these; 手順 is Kyuubu's word for a list of turns and is not used for a step.
 * The cube words follow Kyuubu's own Japanese (手, 回す, 戻る, 進む, 速さ). A native read of how a cuber would say
 * it is still recommended.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };
const ASK = "A native read of how a cuber would say these is recommended; the cube words follow Kyuubu's own Japanese.";
const r = (text: string, back: string): DraftedPhrase => ({ text, back, review: AGENT_READ, ask: ASK });

export const JA_DRAFTED_CUBEMETHOD: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "cubemethod.speedLabel": r("再生の速さ", "Playback speed"),
  "cubemethod.speedSlow": r("ゆっくり", "Slowly"),
  "cubemethod.speedNormal": r("ふつう", "Ordinary"),
  "cubemethod.speedFast": r("速く", "Fast"),
  "cubemethod.replayStep": r("この段階を最初から", "This step from the start"),
  "cubemethod.begins": r("この段階のはじめ", "The start of this step"),
  "cubemethod.turnsLabel": r("この段階の回転", "The turns of this step"),
  "cubemethod.watching": r(
    "回転を1手ずつ見ていきます。一時停止してじっくり見たり、「戻る」「進む」で1手ずつ見直したり、バーをドラッグして好きな手へ移動したりできます。キューブを自分で回せば、そこから自分で続けられます。",
    "Go through the turns one move at a time. You can pause to look closely, go over a move again with Back and Forward, or drag the bar to move to any move. If you turn the cube yourself, you carry on from there yourself.",
  ),
  "cubemethod.lessonEnd": r(
    "できました。この段階は完了で、キューブは正しい状態です。好きな手まで戻って見直したり、最初から再生し直したり、自分で回したりできます。",
    "Done. This step is complete and the cube is in the right state. You can go back to any move to look again, play it again from the start, or turn it yourself.",
  ),
  "cubemethod.hideTurns": r("回転を隠す", "Hide the turns"),
  "cubemethod.makeTurn": r("この1手を代わりに回す", "Turn this one move for me"),
};
