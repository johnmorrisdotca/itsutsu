/**
 * The error a puzzle throws for a size it is not played at, which `generate.ts` lets through where it tries the next
 * seed for any other: a mistake in the code that asked, said to the developer who made it, never to a reader.
 */
export function assertedRangeError(message: string): RangeError {
  return new RangeError(message);
}
