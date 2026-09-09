import type { ReactNode } from "react";

/**
 * A row of equal cells, each a figure with its name over it.
 *
 * Equal by construction rather than by counting: the cells are laid out as
 * many equal columns as the width allows, so a fourth figure — a rating, when
 * these records get one — drops in beside the other three without anything
 * being rearranged, and on a phone they wrap into rows of two instead of
 * squeezing. Nothing here knows how many figures it is showing.
 */
export type Figure = {
  label: string;
  value: ReactNode;
  /** A quieter line under the figure, where one needs saying. */
  note?: string;
  /** Set for a figure that is a word rather than a number — a tier, a rank. */
  plain?: boolean;
  /**
   * A name for the value, where one is already established. Without it the
   * name is folded from the label, which is enough for a figure nothing else
   * refers to by name.
   */
  testId?: string;
};

export function Figures({ figures, testId }: { figures: readonly Figure[]; testId?: string }) {
  if (figures.length === 0) return null;
  return (
    <dl
      className="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-x-6 gap-y-3"
      data-testid={testId}
    >
      {figures.map((figure) => (
        <div key={figure.label} className="flex flex-col gap-0.5" data-testid="figure">
          <dt className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{figure.label}</dt>
          <dd
            className={figure.plain === true ? "text-lg" : "font-mono text-lg tabular-nums"}
            data-testid={figure.testId ?? `figure-${figure.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
          >
            {figure.value}
          </dd>
          {figure.note !== undefined ? <dd className="text-xs text-muted">{figure.note}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
