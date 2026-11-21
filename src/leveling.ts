/** XP a message earns, at random within this range, as in Nexo's earlier version. */
export const XP_PER_MESSAGE = { min: 15, max: 25 } as const;

/** How long a member waits before a message earns XP again, so spamming does not pay. */
export const XP_COOLDOWN_MS = 20_000;

/** XP needed to go from `level` to `level + 1`: 50 for level 1, 105 more for level 2, and so on. */
export function xpForNextLevel(level: number): number {
    return 5 * level ** 2 + 50 * level + 50;
}

/** Where a member stands for their total XP: the level, and how far into the next one they are. */
export function levelFor(totalXp: number): { level: number; xp: number; needed: number } {
    let level = 0;
    let xp = totalXp;
    while (xp >= xpForNextLevel(level)) {
        xp -= xpForNextLevel(level);
        level += 1;
    }
    return { level, xp, needed: xpForNextLevel(level) };
}

/** The XP one message earns; `random` is Math.random, or a fixed value in tests. */
export function rollXp(random: () => number = Math.random): number {
    const { min, max } = XP_PER_MESSAGE;
    return min + Math.floor(random() * (max - min + 1));
}

/** The level a member just reached with the XP they earned, or nothing if it stayed the same. */
export function reachedLevel(totalXp: number, earned: number): number | undefined {
    const { level } = levelFor(totalXp);
    return level > levelFor(totalXp - earned).level ? level : undefined;
}

/**
 * Remembers when each member last earned XP, in memory: after a restart a member may earn XP once
 * early, which costs nothing. Past `limit` entries, it forgets those whose cooldown is over.
 */
export function xpCooldowns(limit = 10_000) {
    const lastAt = new Map<string, number>();
    return {
        /** True when the member may earn XP now; their cooldown then starts again. */
        take(member: string, now: number): boolean {
            if (now - (lastAt.get(member) ?? Number.NEGATIVE_INFINITY) < XP_COOLDOWN_MS)
                return false;
            lastAt.set(member, now);
            if (lastAt.size > limit) {
                for (const [key, at] of lastAt) if (now - at >= XP_COOLDOWN_MS) lastAt.delete(key);
            }
            return true;
        },
        get size(): number {
            return lastAt.size;
        },
    };
}
