import { autorole } from "./autorole.ts";
import { avatar } from "./avatar.ts";
import type { Command } from "./command.ts";
import { goodbye, welcome } from "./greeting.ts";
import { help } from "./help.ts";
import { info } from "./info.ts";
import { leaderboard, rank } from "./levels.ts";
import { ban, kick, timeout, unban, untimeout } from "./moderation.ts";
import { modlog } from "./modlog.ts";
import { ping } from "./ping.ts";
import { serverinfo } from "./serverinfo.ts";
import { ticket } from "./ticket.ts";
import { userinfo } from "./userinfo.ts";
import { unwarn, warn, warnings } from "./warnings.ts";

/** Every command the bot registers with Discord; /help lists this same list, itself included. */
export const commands: Command[] = [
    ping,
    info,
    serverinfo,
    userinfo,
    avatar,
    welcome,
    goodbye,
    autorole,
    warn,
    warnings,
    unwarn,
    timeout,
    untimeout,
    kick,
    ban,
    unban,
    modlog,
    ticket,
    rank,
    leaderboard,
];
commands.push(help(commands));
