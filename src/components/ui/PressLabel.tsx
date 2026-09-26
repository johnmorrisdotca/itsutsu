/**
 * A PRESS'S WORDS, ITS ONE KANJI AND THE ARROW, drawn alike on every button
 * that starts something: Start 始 →, Start alone 独 →, Start with a friend 友 →.
 * One kanji each, as John asked of these labels (2026-09-25: "use SINGLE
 * kanji"), in the lighter face beside the words rather than as a second name.
 */
export function PressLabel({ words, kanji }: { words: string; kanji: string }) {
  return (
    <>
      {words} <span className="font-mincho text-base font-normal opacity-70">{kanji}</span> →
    </>
  );
}
