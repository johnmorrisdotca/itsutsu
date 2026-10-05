/**
 * A BOARD'S HASH: sixteen hex digits that name a Suido board without carrying it. The huge levels' boards are the biggest
 * data in the package (130 KB for the 20×50's sixty-four), and a function that carried them would be over the
 * ceiling `functions:size` holds, so a server knows a huge level by this hash alone (`hugeLevels.data.ts`) and the
 * boards themselves are fetched by the browser. It is two FNV-1a runs of 32 bits from different starts, which is not a defence
 * against anybody (a board's answer is checked in full by the package, whatever its hash says) but a name: of the sixty-four
 * boards a size has, no two share one, and a board that is not one of them does not match any, and a test holds both.
 */
/** How many leading characters of a board stand for it in a search of the database: its size and its first rows, which no two of a size's sixty-four share. */
export const PREFIX = 40;

export function suidoBoardHash(code: string): string {
  let a = 0x811c9dc5;
  let b = 0x9747b28c;
  for (let at = 0; at < code.length; at += 1) {
    const char = code.charCodeAt(at);
    a = Math.imul(a ^ char, 0x01000193) >>> 0;
    b = Math.imul(b ^ (char + at), 0x85ebca6b) >>> 0;
    b ^= b >>> 13;
  }
  return `${a.toString(16).padStart(8, "0")}${b.toString(16).padStart(8, "0")}`;
}
