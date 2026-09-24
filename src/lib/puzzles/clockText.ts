/**
 * A time taken, as a clock shows it: `m:ss`, and `h:mm:ss` past an hour.
 *
 * A plain module rather than a helper in the solve's client file, because the
 * race page, the fastest board and a member's own page are server components
 * and a function exported from a "use client" file cannot be called there.
 */
export function clockText(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const s = seconds % 60;
  const m = Math.floor(seconds / 60) % 60;
  const h = Math.floor(seconds / 3600);
  const two = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`;
}
