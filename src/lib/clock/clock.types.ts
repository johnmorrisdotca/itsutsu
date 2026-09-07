/**
 * A time control, in the shape professional go and renju use: a main time,
 * then a number of byoyomi (秒読み) periods. Spending less than a period on a
 * move gives you that whole period back, so a player in byoyomi can play
 * indefinitely as long as every move is quick enough.
 */
export type TimeControl = {
  /** Main time in milliseconds. Zero drops straight into byoyomi. */
  mainMs: number;
  /** One byoyomi period in milliseconds. Zero means sudden death. */
  byoyomiMs: number;
  /** How many byoyomi periods the player gets. */
  periods: number;
};

export type SeatClock = {
  /** Main time left, in milliseconds. */
  mainMs: number;
  /** Time left in the period being used now. */
  periodMs: number;
  /** Periods still available, including the one in progress. */
  periodsLeft: number;
  /** True once main time is gone and periods are being spent. */
  inByoyomi: boolean;
  /** True once there is no time of any kind left. */
  flagged: boolean;
};
