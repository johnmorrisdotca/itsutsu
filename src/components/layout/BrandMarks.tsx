/**
 * The Itsutsu marks, from the brand kit in public/brand (guidance in
 * docs/brand/START-HERE.md).
 *
 * The kit ships a light and a dark version of each mark rather than one that
 * recolours, because the five stones are the identity — black, ivory, ivory,
 * ivory, black — and their borders have to flip with the background to stay
 * the same apparent size. So each mark is two images, and the theme decides
 * which one is visible.
 *
 * The hero is drawn from public/brand/onpage/, which is the kit's hero with
 * its canvas fill removed and nothing else changed. The kit's fill is for the
 * mark standing alone; on a page it painted a flat rectangle over the paper
 * gradient and read as a box around the logo.
 *
 * "Itsutsu" in prose, lowercase "itsutsu" in the Latin logo, 五つ in Japanese.
 */
type MarkProps = { className?: string };

function Swapped({
  light,
  dark,
  alt,
  className,
}: {
  light: string;
  dark: string;
  alt: string;
  className?: string;
}) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVGs */}
      <img src={light} alt={alt} className={`dark:hidden ${className ?? ""}`} />
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVGs */}
      <img src={dark} alt="" aria-hidden="true" className={`hidden dark:block ${className ?? ""}`} />
    </>
  );
}

/** Lowercase wordmark with the marble i-dot and five stones. For headers. */
export function BrandWordmark({ className }: MarkProps) {
  return (
    <Swapped
      light="/brand/itsutsu-wordmark-light.svg"
      dark="/brand/itsutsu-wordmark-dark.svg"
      alt="itsutsu"
      className={className}
    />
  );
}

/** The wide hero: 五つ avatar beside the wordmark. For large page headers. */
export function BrandHero({ className }: MarkProps) {
  return (
    <Swapped
      light="/brand/onpage/itsutsu-hero-light.svg"
      dark="/brand/onpage/itsutsu-hero-dark.svg"
      alt="Itsutsu"
      className={className}
    />
  );
}

/** The rounded-square 五つ avatar. For compact placements. */
export function BrandAvatar({ className }: MarkProps) {
  return (
    <Swapped
      light="/brand/itsutsu-avatar-charcoal.svg"
      dark="/brand/itsutsu-avatar-ivory.svg"
      alt="五つ"
      className={className}
    />
  );
}
