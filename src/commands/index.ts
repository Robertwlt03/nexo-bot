import { autorole } from "./autorole.ts";
import { avatar } from "./avatar.ts";
import type { Command } from "./command.ts";
import { goodbye, welcome } from "./greeting.ts";
import { help } from "./help.ts";
import { info } from "./info.ts";
import { levelrole } from "./levelrole.ts";
import { leaderboard, levels, rank } from "./levels.ts";
import { ban, kick, timeout, unban, untimeout } from "./moderation.ts";
import { modlog } from "./modlog.ts";
import { serverinfo } from "./serverinfo.ts";
import { ticket } from "./ticket.ts";
import { userinfo } from "./userinfo.ts";
import { warn, warnings } from "./warnings.ts";

/** Every command the bot registers with Discord; /help lists this same list, itself included. */
export const commands: Command[] = [
    info,
    serverinfo,
    userinfo,
    avatar,
    welcome,
    goodbye,
    autorole,
    warn,
    warnings,
    timeout,
    untimeout,
    kick,
    ban,
    unban,
    modlog,
    ticket,
    rank,
    leaderboard,
    levels,
    levelrole,
];
commands.push(help(commands));
