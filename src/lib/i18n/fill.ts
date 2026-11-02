import type { Vars } from "./i18n.types";

/**
 * Fills `{placeholders}`. A name nobody supplied is left standing rather than
 * blanked: an empty gap in a sentence is a bug that reads as prose, and
 * `{game}` on the page is a bug that reads as a bug. The coverage test is
 * what stops either reaching a reader — it holds every translation's
 * placeholders to the English original's.
 */
export function fill(template: string, vars?: Vars): string {
  if (vars === undefined) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.hasOwn(vars, name) ? (vars[name] as string) : whole,
  );
}
