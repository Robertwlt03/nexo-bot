import { avatar } from "./avatar.ts";
import type { Command } from "./command.ts";
import { help } from "./help.ts";
import { info } from "./info.ts";
import { ping } from "./ping.ts";
import { serverinfo } from "./serverinfo.ts";
import { userinfo } from "./userinfo.ts";
import { welcome } from "./welcome.ts";

/** Every command the bot registers with Discord; /help lists this same list, itself included. */
export const commands: Command[] = [ping, info, serverinfo, userinfo, avatar, welcome];
commands.push(help(commands));
