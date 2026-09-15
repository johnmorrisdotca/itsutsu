/**
 * Compares two strings without leaking how far they match through timing.
 *
 * A `===` on a wrong guess returns the moment the first character differs,
 * so an attacker who can measure response time can recover a secret one
 * character at a time. This always walks the shorter check to its own end
 * (the length compare is its own, separate, cheap leak that every secret
 * comparison in this codebase already accepts — token length is not the
 * secret) and every character of the equal-length case, so a wrong answer
 * takes the same time whichever character it is wrong at.
 *
 * Extracted from `isOperatorLogin` so a second token could check its secret
 * with the same discipline rather than a second, easily drifted copy of the
 * loop. That second token was the board's, which went with the local board
 * routes; the operator login is its one caller now.
 */
export function constantTimeEqual(expected: string, actual: string): boolean {
  if (expected.length !== actual.length) return false;

  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ actual.charCodeAt(index);
  }
  return difference === 0;
}
