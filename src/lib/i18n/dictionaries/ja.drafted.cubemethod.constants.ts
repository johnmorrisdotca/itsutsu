import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase } from "./ja.drafted.constants";

/**
 * Japanese for the cubemethod.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Written by a machine and read by nobody: each row asks for a read, and the cube
 * words follow Kyuubu's own Japanese (手, 回す, 戻る, 進む, 速さ).
 */
const ASK = "Drafted without a reader of Japanese. The cube words follow Kyuubu's own Japanese; a native read of how a cuber would say it is recommended.";

export const JA_DRAFTED_CUBEMETHOD: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "cubemethod.speedLabel": { text: "再生の速さ", back: "Playback speed", ask: ASK },
  "cubemethod.speedSlow": { text: "遅め", back: "Slower", ask: ASK },
  "cubemethod.speedNormal": { text: "ふつうの速さ", back: "Ordinary speed", ask: ASK },
  "cubemethod.speedFast": { text: "速め", back: "Faster", ask: ASK },
  "cubemethod.replayStep": { text: "この手順を最初から", back: "This step from the start", ask: ASK },
  "cubemethod.begins": { text: "この手順のはじめ", back: "The start of this step", ask: ASK },
  "cubemethod.turnsLabel": { text: "この手順の回転", back: "The turns of this step", ask: ASK },
  "cubemethod.watching": {
    text: "回転を1手ずつ見ます。一時停止してよく見たり、戻る・進むで1手ずつ見直したり、バーをドラッグして好きな手に飛んだりできます。キューブを自分で回すと、そこから手で続けられます。",
    back: "Watch the turns one move at a time. You can pause to look closely, go back and forward one move at a time to look again, or drag the bar to jump to any move. If you turn the cube yourself, you carry on by hand from there.",
    ask: ASK,
  },
  "cubemethod.lessonEnd": {
    text: "完了です。この手順は終わり、キューブは正しい状態になりました。好きな手に戻って見直したり、最初から再生したり、自分で回したりできます。",
    back: "Done. This step is finished and the cube is now as it should be. You can go back to any move to look again, play it again from the start, or turn it yourself.",
    ask: ASK,
  },
  "cubemethod.hideTurns": { text: "回転の表示を閉じる", back: "Close the display of the turns", ask: ASK },
  "cubemethod.makeTurn": { text: "この1手を代わりに回す", back: "Turn this one move for me", ask: ASK },
};
