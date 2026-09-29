import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { KUMIMOJI_SHOTS, KUMIMOJI_SHOT_ORDER } from "@/lib/puzzles/kumimoji/shots.constants";

/**
 * KUMIMOJI BEING PLAYED, in pictures taken from real play
 * (`e2e/kumimoji-shots.spec.ts`): four phone screens, two to a row on a phone
 * and four on a desk, and the wallpaper across the width under them. Each
 * opens full size on a tap, since a phone screen drawn a third of a phone
 * wide is a glance, not a read. Static files, lazily loaded, nothing asked of
 * the server; the width and height hold each picture's room before it comes.
 */
export function KumimojiShots() {
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="kumimoji-shots">
      <h2 className={SECTION_TITLE}>
        See it played <span className="font-mincho normal-case tracking-normal">実戦</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {KUMIMOJI_SHOT_ORDER.map((key) => {
          const shot = KUMIMOJI_SHOTS[key];
          const wide = shot.width > shot.height;
          return (
            <figure key={key} className={`flex min-w-0 flex-col gap-1.5 ${wide ? "col-span-2 sm:col-span-4" : ""}`} data-testid="kumimoji-shot" data-shot={key}>
              <a href={shot.src} target="_blank" rel="noopener" className="block overflow-hidden rounded-lg border border-rule" aria-label={`${shot.caption} Opens the picture full size.`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- a static screenshot, already sized, with nothing for the optimiser to do */}
                <img src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} loading="lazy" decoding="async" className="h-auto w-full" />
              </a>
              <figcaption className="text-xs leading-snug text-muted">
                <span className="font-mincho text-ink">{shot.kanji}</span> {shot.caption}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
