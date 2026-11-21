import {
    AttachmentBuilder,
    ContainerBuilder,
    HeadingLevel,
    heading,
    MessageFlags,
    SectionBuilder,
    subtext,
    TextDisplayBuilder,
} from "discord.js";

/** Nexo's amber: the edge of every card, the only color Nexo uses. */
export const NEXO_AMBER = 0xe8a33d;

/** Facts as a small gray label above each value; a fact without a value is left out. */
export function facts(pairs: readonly [string, string | undefined][]): string {
    return pairs
        .filter((pair): pair is [string, string] => pair[1] !== undefined)
        .map(([label, value]) => `${subtext(label.toUpperCase())}\n${value}`)
        .join("\n");
}

/**
 * A card: a picture across the top, if it has one, then the heading, if it has one, and the text
 * below it; with a picture beside, it sits next to both. Callers add more blocks, such as
 * buttons, to the container it gives back.
 */
export function card(
    title: string | null,
    text?: string,
    { picture, top }: { picture?: string; top?: string } = {},
): ContainerBuilder {
    const heads = title === null ? [] : [heading(title, HeadingLevel.Two)];
    const content = [...heads, ...(text ? [text] : [])].join("\n");
    const container = new ContainerBuilder().setAccentColor(NEXO_AMBER);
    if (top) {
        container.addMediaGalleryComponents((gallery) =>
            gallery.addItems((item) => item.setURL(top)),
        );
    }
    // Discord refuses an empty text, so a card of only a picture has none.
    if (!content) return container;
    const display = new TextDisplayBuilder().setContent(content);
    if (!picture) return container.addTextDisplayComponents(display);
    return container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(display)
            .setThumbnailAccessory((thumbnail) => thumbnail.setURL(picture)),
    );
}

/**
 * A picture Nexo drew, as the file to send with the message and the URL a card shows it by.
 * Discord shows a sent file only where a card points to it.
 */
export function drawn(name: string, png: Buffer): { file: AttachmentBuilder; url: string } {
    return { file: new AttachmentBuilder(png, { name }), url: `attachment://${name}` };
}

/** The flags a card needs; a private answer adds Ephemeral. */
export const CARD = MessageFlags.IsComponentsV2;
export const PRIVATE_CARD = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;
