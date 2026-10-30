import type { CopyReview } from "../copyJa.types";

import type { PuzzleCopyJa } from "./puzzles.ja.types";

/** Kuniate's words in Japanese, the sibling of `KUNIATE_DISPLAY`. Read by the reviewer agent on 2026-10-30. */
const AGENT_READ: CopyReview = { by: "agent", on: "2026-10-30" };

export const PUZZLE_COPY_JA_KUNIATE = {
  kuniate: {
    tagline: ["形、旗、首都のどれかを手がかりに、隠された国を6回以内で当てます。", "From one clue among its shape, flag or capital, guess the hidden country within six tries."],
    inspiredBy: ["毎日の国当てパズル", "the daily country-guessing puzzle"],
    origin: [
      "国の形を見てどの国か当てる遊びは、学校の地図帳と同じくらい古いものです。今では毎日のパズルとしても親しまれています。このサイトの形はパブリックドメインの地図データNatural Earthから描いたもので、旗と首都は、自前のオープンソースのパッケージChizu、Hata、Kuniから取っています。",
      "The game of looking at a country's shape and guessing which country it is, is about as old as the school atlas. It is now also loved as a daily puzzle. The shapes on this site are drawn from the public-domain map data Natural Earth, and the flags and capitals are from our own open-source packages, Chizu, Hata and Kuni.",
    ],
    rules: [
      ["国が1つ隠されています。選んだ手がかりとして、その国の形、旗、または首都の名前が示されます。", "One country is hidden. As the clue you chose, its shape, flag or capital's name is shown."],
      ["予想は6回までです。名前を入力し始めたら、一覧から選びます。一覧にはすべての国と地域が、表示している言語で載っています。", "You have up to six guesses. Once you start entering a name, choose from the list. All countries and territories are on the list, in the language being displayed."],
      ["はずれると、選んだ国が答えからどれだけ離れているかと、どちらの方角にあるかが示されます。", "When you miss, you are shown how far the country you chose is from the answer, and in which direction the answer lies."],
      ["今日のパズルは誰にとっても同じで、手がかりごとに別の国です。それ以外は、番号ごとに新しい国が出ます。", "Today's puzzle is the same for everybody, and is a different country for each kind of clue. Otherwise a new country comes with each number."],
    ],
    board: ["形は国の形だけを見せます。旗はその国の旗を見せます。首都は首都の名前を見せます。初級はよく知られた国、中級はそれより多くの国、上級は世界の195か国のどれかです。", "Shape shows only the country's shape. Flag shows that country's flag. Capital shows the name of the capital. Easy is well-known countries, medium more countries than that, and hard any of the world's 195 countries."],
    review: AGENT_READ,
  },
} as const satisfies Record<"kuniate", PuzzleCopyJa>;
