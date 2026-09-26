/** A challenge a board can have. Blocked cells count as walls: both are places a line cannot go. */
export type Challenge = "bridges" | "walls" | "waypoints" | "wrap";

/** Where a level sits in its block's lesson: its 15th teaches the block's twist, its 16th tests it. `newOnes` are what no earlier level of the size had. */
export type TwistRole = { role: "teaches" | "tests"; challenges: Challenge[]; newOnes: Challenge[] };
