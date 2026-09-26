/** A challenge a board can have. Blocked cells count as walls: both are places a line cannot go. Explosions break a drawn line every so many strokes; a hexagon gives every cell six neighbours; a stroke limit counts the lifts; a sparse board has few, long lines. */
export type Challenge = "bridges" | "walls" | "waypoints" | "wrap" | "explosions" | "strokes" | "hexagon" | "sparse";

/** Where a level sits in its block's lesson: its 15th teaches the block's twist, its 16th tests it. `newOnes` are what no earlier level of the size had. */
export type TwistRole = { role: "teaches" | "tests"; challenges: Challenge[]; newOnes: Challenge[] };
