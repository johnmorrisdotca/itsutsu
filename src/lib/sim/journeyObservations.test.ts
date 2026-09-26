import { describe, expect, it } from "vitest";

import { journeyObservations } from "./journeyObservations";
import { runJourneySimulation } from "./journeys";

describe("journeyObservations", () => {
  it("returns five to eight non-empty, distinct sentences", () => {
    const result = runJourneySimulation(20260925);
    const observations = journeyObservations(result);
    expect(observations.length).toBeGreaterThanOrEqual(5);
    expect(observations.length).toBeLessThanOrEqual(8);
    for (const line of observations) expect(line.length).toBeGreaterThan(20);
    expect(new Set(observations).size).toBe(observations.length);
  });

  it("is deterministic for the same result", () => {
    const result = runJourneySimulation(11);
    expect(journeyObservations(result)).toEqual(journeyObservations(result));
  });
});
