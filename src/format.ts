import { TimestampStyles, time } from "discord.js";

/** A date as Discord shows it to each member, in their own time zone: the day and how long ago. */
export function dateWithAge(date: Date): string {
    return `${time(date, TimestampStyles.LongDate)} · ${time(date, TimestampStyles.RelativeTime)}`;
}

/** The first `max` items, then how many more there are: `a b c +2`. */
export function firstWithRest(items: readonly string[], max: number, separator = " "): string {
    const rest = items.length - max;
    return items.slice(0, max).join(separator) + (rest > 0 ? `${separator}+${rest}` : "");
}
