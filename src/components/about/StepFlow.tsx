import type { FlowProps } from "./about.types";

/**
 * A process as numbered stones, the way a go book numbers the moves of a
 * sequence: each step a box with its number on a black stone. Across the page
 * on a wide screen and down it on a phone, where a row of six boxes would be
 * six slivers; the stones carry the order, so no arrow has to.
 */
export function StepFlow({ steps, caption, label }: FlowProps) {
  return (
    <figure className="flex flex-col gap-2" data-testid="about-flow">
      <ol
        className="grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]"
        aria-label={label}
      >
        {steps.map((step, i) => (
          <li key={step.title} className="relative flex flex-col gap-1.5 rounded-lg border border-rule bg-ivory p-3">
            <span className="flex items-center gap-2">
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-[0.7rem] font-semibold text-ivory"
                aria-hidden
              >
                {i + 1}
              </span>
              <span className="text-sm font-semibold">{step.title}</span>
              <span className="font-mincho text-xs opacity-70">{step.kanji}</span>
            </span>
            <span className="text-xs leading-relaxed text-ink-soft">{step.body}</span>
          </li>
        ))}
      </ol>
      <figcaption className="text-xs leading-relaxed text-muted">{caption}</figcaption>
    </figure>
  );
}
