import type { Command } from "./command.ts";
import { help } from "./help.ts";
import { info } from "./info.ts";
import { ping } from "./ping.ts";

/** Every command the bot registers with Discord; /help lists this same list, itself included. */
export const commands: Command[] = [ping, info];
commands.push(help(commands));
