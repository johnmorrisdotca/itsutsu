import type { ReactNode } from "react";

import type { ShotProps } from "./about.types";

/**
 * A picture of the site itself, printed as a figure.
 *
 * The screenshots under `public/art/about/` were taken from a local copy of
 * the site playing real games between the computer players, so every board in
 * them is a position the engine actually reached. Width and height are given so
 * the page does not jump as a picture arrives, and a phone's picture is drawn
 * narrow beside the desk's rather than stretched to the column.
 */
function Shot({ src, alt, width, height, phone = false }: ShotProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a static screenshot with no need of optimisation
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={`h-auto rounded-lg border border-rule bg-ivory ${phone ? "w-full max-w-[13rem]" : "w-full"}`}
    />
  );
}

/** One screenshot, with what it shows written under it. */
export function Screenshot({ caption, ...shot }: ShotProps & { caption: ReactNode }) {
  return (
    <figure className="flex flex-col gap-2" data-testid="about-shot">
      <Shot {...shot} />
      <figcaption className="text-xs leading-relaxed text-muted">{caption}</figcaption>
    </figure>
  );
}

/**
 * Two or more screenshots side by side, under one caption: the same page on a
 * desk and on a phone, or two pictures made the same way. They stack on a phone,
 * where two would be too small to read.
 */
export function ScreenshotRow({ shots, caption }: { shots: ShotProps[]; caption: ReactNode }) {
  return (
    <figure className="flex flex-col gap-2" data-testid="about-shot">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        {shots.map((shot) => (
          <div key={shot.src} className={shot.phone ? "flex shrink-0 justify-center" : "min-w-0 flex-1"}>
            <Shot {...shot} />
          </div>
        ))}
      </div>
      <figcaption className="text-xs leading-relaxed text-muted">{caption}</figcaption>
    </figure>
  );
}
