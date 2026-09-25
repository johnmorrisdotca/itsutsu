/**
 * WHICH SPEC FILES EACH BROWSER SHARD RUNS, balanced by how long they take.
 *
 * Playwright's own `--shard=N/M` deals the files out evenly by count of tests,
 * so a shard that drew the slow files — the whole-site sweeps of page width
 * and shape, the screenshots — ran for 7.9 minutes while another ran 3.4, and
 * the deploy waited on the slowest (measured 2026-09-25, run 36160449457: 66
 * minutes of tests over 14 shards, 4.7 each if even). John, 2026-09-22: "the
 * fastest deploy times possible with means shards and testing and making sure
 * things happen in parallel."
 *
 * So each file carries the seconds it last took (`e2e/shard-times.json`,
 * written from a run's log by `scripts/e2e-times.mjs`), and the files are dealt
 * heaviest first, each to the shard with the least so far: the longest-
 * processing-time rule, within a few per cent of the best split for a spread
 * like this one. A file with no time yet — a new spec — counts as the median
 * file, so it is placed like an ordinary one rather than piled on shard one.
 *
 * Every file lands in exactly one shard, which the unit test holds, and the
 * split depends only on the names and the times, so every runner computes the
 * same one. Plain JavaScript, so the workflow runs it with bare `node`.
 */

/** The seconds a file with no recorded time counts as: the middle of the recorded ones, or one if none. */
export function unknownWeight(times) {
  const known = Object.values(times).filter((seconds) => typeof seconds === "number" && seconds > 0).sort((a, b) => a - b);
  if (known.length === 0) return 1;
  return known[Math.floor(known.length / 2)];
}

/**
 * The files split into `total` shards by time. Returns one array per shard,
 * each sorted by name so a shard's log reads in a stable order.
 */
export function splitByTime(files, times, total) {
  if (!Number.isInteger(total) || total < 1) throw new Error(`a shard count of ${total} is not one`);
  const fallback = unknownWeight(times);
  const weighed = [...new Set(files)]
    .map((file) => ({ file, seconds: typeof times[file] === "number" && times[file] > 0 ? times[file] : fallback }))
    // Heaviest first; a tie goes by name, so the split never depends on the order the files were listed in.
    .sort((a, b) => b.seconds - a.seconds || a.file.localeCompare(b.file));
  const shards = Array.from({ length: total }, () => ({ seconds: 0, files: [] }));
  for (const { file, seconds } of weighed) {
    let lightest = shards[0];
    for (const shard of shards) if (shard.seconds < lightest.seconds) lightest = shard;
    lightest.files.push(file);
    lightest.seconds += seconds;
  }
  return shards.map((shard) => shard.files.sort((a, b) => a.localeCompare(b)));
}
