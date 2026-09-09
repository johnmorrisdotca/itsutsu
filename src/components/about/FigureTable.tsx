import type { ReactNode } from "react";

/**
 * A small table printed as a figure, with its caption under it.
 *
 * It was written inside about.more.tsx for the ratings and openings sections;
 * the Go section wants the same thing for a column of numbers, and a second
 * copy of a table is how two tables on one page stop matching. It sits beside
 * Diagram and EloCurve because it is the same kind of thing: a picture the
 * prose points at.
 */
const TH = "px-3 py-1.5 text-left text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase";
const TD = "px-3 py-1.5 align-top";

export function FigureTable({
  head,
  rows,
  caption,
}: {
  head: string[];
  rows: ReactNode[][];
  caption: ReactNode;
}) {
  return (
    <figure className="flex flex-col gap-2" data-testid="about-table">
      <div className="overflow-x-auto rounded-lg border border-rule">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {head.map((cell, i) => (
                <th key={i} className={TH}>
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-rule">
                {row.map((cell, j) => (
                  <td key={j} className={`${TD} ${j > 0 && typeof cell === "number" ? "font-mono tabular-nums" : ""}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="text-xs leading-relaxed text-muted">{caption}</figcaption>
    </figure>
  );
}
