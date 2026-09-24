const SMALL = [
  "no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/**
 * A count under two hundred in words, as a sentence uses one: "sixty-four",
 * "hundred and forty-four". Moved here from the checkers rules page when the XP
 * awards needed it to say how many games there are.
 */
export function inWords(count: number): string {
  if (count >= 100) return count === 100 ? "hundred" : `hundred and ${inWords(count - 100)}`;
  if (count < 20) return SMALL[count];
  const unit = count % 10;
  return unit === 0 ? TENS[Math.floor(count / 10)] : `${TENS[Math.floor(count / 10)]}-${SMALL[unit]}`;
}
