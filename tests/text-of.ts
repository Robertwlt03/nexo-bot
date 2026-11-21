import type { ContainerBuilder } from "discord.js";

/** Every text a card shows, top to bottom, as one string. */
export function textOf(card: ContainerBuilder): string {
    const texts: string[] = [];
    const walk = (component: object) => {
        if ("content" in component) texts.push(String(component.content));
        if ("components" in component) (component.components as object[]).forEach(walk);
    };
    walk(card.toJSON());
    return texts.join("\n");
}
