/**
 * A BOARD'S HASH: sixteen hex digits that name a Suido board without carrying it. The levels' boards are the biggest
 * data in the package (800 KB for the thirteen ordinary sizes, 130 KB for the 20×50's sixty-four alone), and a function
 * that carried them would be over the ceiling `functions:size` holds, so a server knows a level by this hash alone
 * (`levelBoards.data.ts`) and the boards themselves are fetched by the browser. It is two FNV-1a runs of 32 bits from
 * different starts, which is not a defence against anybody (a board's answer is checked in full by the package, whatever
 * its hash says) but a name: of the boards a size has, no two share one, and a board that is not one of them does not
 * match any, and a test holds both.
 */
/** The fewest leading characters of a board that stand for it in a search of the database (`levelBoards.data.ts` gives each size as many more as it takes for no two of its levels to share them). */
export const PREFIX_FLOOR = 12;

/** How many characters a hash is. */
export const HASH_LENGTH = 16;

export function suidoBoardHash(code: string): string {
  let a = 0x811c9dc5;
  let b = 0x9747b28c;
  for (let at = 0; at < code.length; at += 1) {
    const char = code.charCodeAt(at);
    a = Math.imul(a ^ char, 0x01000193) >>> 0;
    b = Math.imul(b ^ (char + at), 0x85ebca6b) >>> 0;
    b ^= b >>> 13;
    b >>>= 0;
  }
  return `${a.toString(16).padStart(8, "0")}${b.toString(16).padStart(8, "0")}`;
}
