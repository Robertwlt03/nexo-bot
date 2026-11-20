/** What the bot needs from its environment; see `.env.example`. */
export type Config = {
    token: string;
    /** A test server: commands appear there at once instead of in every server. */
    guildId?: string;
};

export function readConfig(env: NodeJS.ProcessEnv): Config {
    const token = (env.DISCORD_TOKEN ?? "").trim();
    if (!token) {
        throw new Error("DISCORD_TOKEN is missing: copy .env.example to .env and fill it in.");
    }
    return { token, guildId: env.GUILD_ID?.trim() || undefined };
}
