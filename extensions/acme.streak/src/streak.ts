// `type`, not `interface`: an interface has no index signature, so it is not
// a `JsonValue` and `server.storage` refuses it
export type Streak = {
  /** Days in a row up to and including `last`. */
  days: number;
  /** The calendar day of the newest counted attempt, `YYYY-MM-DD`. */
  last: string;
};

/** What the learner sees: the streak that is alive today. */
export type StreakStatus = {
  days: number;
  /** The streak is alive but today has no attempt yet: it ends tonight. */
  atRisk: boolean;
};

const pad = (value: number): string => String(value).padStart(2, '0');

/** The calendar day of a moment in the time zone of the machine, `YYYY-MM-DD`. */
export const dayOf = (at: number): string => {
  const date = new Date(at);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// local calendar arithmetic: a day with a clock change is still one day
const addDays = (day: string, count: number): string => {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number);
  return dayOf(new Date(year, month - 1, date + count).getTime());
};

/**
 * The streak after an attempt closed at `at`: it grows when the attempt falls
 * on the day after the last one, stays the same within a day, and starts over
 * after a gap.
 */
export const advance = (streak: Streak | undefined, at: number): Streak => {
  const day = dayOf(at);
  if (streak !== undefined && day <= streak.last) return streak;
  const continues = streak !== undefined && addDays(streak.last, 1) === day;
  return { days: continues ? streak.days + 1 : 1, last: day };
};

/** The streak that is alive at `now`: today or yesterday was the last day. */
export const status = (
  streak: Streak | undefined,
  now: number,
): StreakStatus => {
  if (streak === undefined) return { days: 0, atRisk: false };
  const today = dayOf(now);
  if (streak.last === today) return { days: streak.days, atRisk: false };
  if (addDays(streak.last, 1) === today) {
    return { days: streak.days, atRisk: true };
  }
  return { days: 0, atRisk: false };
};
