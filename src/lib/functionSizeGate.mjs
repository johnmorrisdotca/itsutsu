/**
 * The rules the function-size gate holds a build to, apart from the disk.
 *
 * Two limits on every server function Vercel will run: a ceiling no function
 * may pass (`FUNCTION_SIZE_LIMIT_MB`), and a creep no function may make - more
 * than `FUNCTION_GROWTH_ALLOWED` over the size recorded for it in the baseline.
 * John, 2026-09-23, on UmaKuma's: "no more than 20% sounds reasonable." The
 * same rule, ported here the same day. The ceiling stops a
 * disaster; it does not stop a function drifting from 90 MB to 115 without
 * anybody looking, and every megabyte of that counts against the Functions
 * Storage every project on the account shares.
 *
 * Kept in plain JavaScript so `scripts/check-function-sizes.mjs` runs it with
 * bare `node` in the deploy job, and the unit test imports the same code.
 */

/*
 * Just above the largest function Itsutsu builds today: 30.0 MB on 2026-09-24,
 * after the Prisma engines (127 → 44.4 MB) and then every package's changelog
 * (44.4 → 30.0) were taken out. It was 60. UmaKuma's is 120 for its own 90 MB
 * functions. The ceiling only ever comes down.
 */
export const FUNCTION_SIZE_LIMIT_MB = 40;
export const FUNCTION_GROWTH_ALLOWED = 0.2;
/**
 * Growth under this many megabytes never fails, whatever the percentage. A
 * 2 MB function has 0.4 MB of room at 20%, which ordinary build noise can use
 * up; a real creep on a big one is far past it (90 MB at 20% is 18 MB).
 */
export const FUNCTION_GROWTH_FLOOR_MB = 5;
/** How many of a function's routes the baseline keeps to recognise it by. */
export const BASELINE_SAMPLE_SIZE = 10;

/**
 * @typedef {{ name: string; mb: number; routes: string[] }} MeasuredFunction
 * @typedef {{ name: string; mb: number; sample: string[] }} BaselineFunction
 * @typedef {{ functions: BaselineFunction[] }} Baseline
 * @typedef {{ name: string; mb: number; allowedMb: number; baseline: BaselineFunction | null; failure: string | null }} Verdict
 */

/**
 * Which recorded function this one is.
 *
 * Not by name. Vercel bundles routes into a few functions and names each after
 * its alphabetically first route, so adding `/api/accounts/[id]/avatar` renamed
 * the function every API route lives in from `.../buddies` to `.../avatar` - a
 * baseline keyed on names would have lost it, and with it the 20% rule. The
 * baseline keeps a sample of each function's routes instead, and a function is
 * the recorded one whose sample it holds most of.
 *
 * @param {MeasuredFunction} measured
 * @param {readonly BaselineFunction[]} recorded
 * @returns {BaselineFunction | null}
 */
export function matchBaseline(measured, recorded) {
  const routes = new Set(measured.routes);
  let best = null;
  let bestShared = 0;
  for (const entry of recorded) {
    const shared = entry.sample.filter((route) => routes.has(route)).length;
    if (shared > bestShared || (shared === bestShared && shared > 0 && entry.name === measured.name)) {
      best = entry;
      bestShared = shared;
    }
  }
  return best;
}

/**
 * Each function's size against its limits: the ceiling, and its recorded size
 * plus the allowed growth where it has one. Growth fails only when it is both
 * more than the allowed percentage and more than the floor in megabytes. A
 * function the baseline does not know has the ceiling alone.
 *
 * @param {readonly MeasuredFunction[]} measured
 * @param {Baseline | null} baseline
 * @param {{ limitMb?: number; growth?: number; floorMb?: number }} [options]
 * @returns {Verdict[]}
 */
export function judgeFunctionSizes(measured, baseline, options = {}) {
  const limitMb = options.limitMb ?? FUNCTION_SIZE_LIMIT_MB;
  const growth = options.growth ?? FUNCTION_GROWTH_ALLOWED;
  const floorMb = options.floorMb ?? FUNCTION_GROWTH_FLOOR_MB;
  return measured.map((fn) => {
    const recorded = baseline ? matchBaseline(fn, baseline.functions) : null;
    const grown = recorded ? recorded.mb + Math.max(recorded.mb * growth, floorMb) : Number.POSITIVE_INFINITY;
    const allowedMb = Math.min(limitMb, grown);
    let failure = null;
    if (fn.mb > limitMb) {
      failure = `${fn.name} is ${fn.mb.toFixed(1)} MB, over the ${limitMb} MB ceiling.`;
    } else if (recorded && fn.mb > grown) {
      const percent = Math.round((fn.mb / recorded.mb - 1) * 100);
      const over = (fn.mb - recorded.mb).toFixed(1);
      failure = `${fn.name} is ${fn.mb.toFixed(1)} MB, ${percent}% (${over} MB) over the ${recorded.mb.toFixed(1)} MB recorded for it (${Math.round(growth * 100)}% or ${floorMb} MB allowed, whichever is more).`;
    }
    return { name: fn.name, mb: fn.mb, allowedMb, baseline: recorded, failure };
  });
}

/**
 * The baseline to commit for a build: each function's size, to a tenth of a
 * megabyte, and the first routes it holds to recognise it by next time.
 *
 * @param {readonly MeasuredFunction[]} measured
 * @returns {Baseline}
 */
export function recordBaseline(measured) {
  return {
    functions: [...measured]
      .sort((left, right) => right.mb - left.mb)
      .map((fn) => ({
        name: fn.name,
        mb: Math.round(fn.mb * 10) / 10,
        /* The pages and routes themselves; a `.rsc` twin says nothing its page does not. */
        sample: fn.routes.filter((route) => !route.endsWith(".rsc")).sort().slice(0, BASELINE_SAMPLE_SIZE),
      })),
  };
}
