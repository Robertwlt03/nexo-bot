import type { Texts } from "../texts.ts";

export const de: Texts = {
    error: "Da ist etwas schiefgelaufen. Versuch es gleich noch einmal.",
    unknownCommand: "Diesen Befehl hat Nexo nicht (mehr).",
    commandDescriptions: {
        info: "Zeigt, was Nexo ist und wie es ihm geht",
        help: "Zeigt die Befehle, die du benutzen kannst",
        serverinfo: "Zeigt diesen Server: Mitglieder, Kanäle, Boosts und sein Alter",
        userinfo: "Zeigt ein Mitglied: Kontoalter, Beitritt und Rollen",
        avatar: "Zeigt das Profilbild eines Mitglieds in voller Größe",
        welcome: "Begrüßt neue Mitglieder in einem Kanal",
        goodbye: "Verabschiedet Mitglieder in einem Kanal, wenn sie gehen",
        autorole: "Gibt neuen Mitgliedern automatisch Rollen",
        warn: "Verwarnt ein Mitglied per Direktnachricht; Nexo merkt sich die Verwarnung",
        warnings: "Zeigt die Verwarnungen eines Mitglieds",
        timeout: "Schickt ein Mitglied eine Zeit lang in den Timeout",
        untimeout: "Beendet den Timeout eines Mitglieds vorzeitig",
        kick: "Entfernt ein Mitglied vom Server; es kann wieder beitreten",
        ban: "Bannt jemanden vom Server",
        unban: "Hebt einen Bann auf",
        modlog: "Protokolliert in einem Kanal, was Moderatoren über Nexo oder Discord tun",
        rank: "Zeigt Level und XP eines Mitglieds",
        leaderboard: "Zeigt, wer die meisten XP hat",
        ticket: "Lässt Mitglieder ein privates Ticket an das Team öffnen",
        levels: "Legt fest, wo Level-ups erscheinen, oder schaltet sie aus",
        levelrole: "Gibt Mitgliedern Rollen, wenn sie ein Level erreichen",
    },
    connection: "Verbindung zu Discord",
    tagline: "Der ruhige Community-Bot.",
    infoAddButton: "Zum Server hinzufügen",
    onlineSince: "Online seit",
    helpTitle: "Was du mit Nexo tun kannst",
    helpHint: "Klick auf einen Befehl, um ihn zu benutzen.",
    helpSections: {
        general: "Allgemein",
        members: "Mitglieder und Level",
        setup: "Server einrichten",
        moderation: "Moderation",
    },
    serverOnly: "Dieser Befehl geht nur auf einem Server.",
    owner: "Inhaber",
    members: "Mitglieder",
    channels: "Kanäle",
    roles: "Rollen",
    boosts: "Boosts",
    boostTier: "Stufe",
    created: "Erstellt",
    account: "Konto",
    joined: "Beigetreten",
    notOnServer: "Nicht (mehr) auf diesem Server",
    avatarTitle: (name: string) => `Profilbild von ${name}`,
    accountPicture: "Kontobild",
    testButton: "Test senden",
    greetingTestSent: (channel: string) => `In ${channel} geschickt.`,
    greetingNotSetUp: (setup: string) =>
        `Das ist noch nicht eingerichtet. Richte es mit ${setup} ein.`,
    channelGone: (setup: string) => `Der Kanal dafür ist weg. Wähle mit ${setup} einen neuen.`,
    cannotPost: (channel: string, missing: string) =>
        `Nexo kann in ${channel} noch nicht schreiben. Gib ihm dort diese Berechtigungen: ` +
        `${missing}.`,
    permissionNames: {
        AttachFiles: "Dateien anhängen",
        ViewChannel: "Kanal ansehen",
        SendMessages: "Nachrichten senden",
        EmbedLinks: "Links einbetten",
        CreatePrivateThreads: "Private Threads erstellen",
        SendMessagesInThreads: "Nachrichten in Threads senden",
        ManageThreads: "Threads und Posts verwalten",
        ReadMessageHistory: "Nachrichtenverlauf lesen",
        MentionEveryone: "Erwähnung von @everyone, @here und allen Rollen",
    },
    welcome: {
        defaultMessage: "Willkommen, {user}! Schön, dass du da bist.",
        saved: (channel: string) => `Neue Mitglieder werden jetzt in ${channel} begrüßt.`,
        off: "Die Begrüßung ist aus.",
    },
    goodbye: {
        defaultMessage: "Bis bald! Wir sind jetzt {membercount} Mitglieder.",
        saved: (channel: string) => `Wer geht, wird jetzt in ${channel} verabschiedet.`,
        off: "Der Abschied ist aus.",
    },
    autoroleAdded: (role: string) => `Neue Mitglieder bekommen jetzt ${role}.`,
    autoroleAlready: (role: string) => `Neue Mitglieder bekommen ${role} schon.`,
    autoroleRemoved: (role: string) => `Neue Mitglieder bekommen ${role} nicht mehr.`,
    autoroleNotThere: (role: string) => `${role} gehört nicht zu den automatischen Rollen.`,
    autoroleNone: (add: string) =>
        `Neue Mitglieder bekommen noch keine Rollen. Füge eine mit ${add} hinzu.`,
    autoroleListTitle: "Rollen für neue Mitglieder",
    autoroleEveryone: "@everyone hat jedes Mitglied schon.",
    autoroleManaged: (role: string) =>
        `${role} gehört zu einer Integration, etwa einem Bot oder Server-Boosts; die vergibt ` +
        `Discord selbst.`,
    autoroleNoPermission:
        "Nexo braucht dafür die Berechtigung „Rollen verwalten“: gib sie Nexos Rolle in den " +
        "Servereinstellungen.",
    autoroleAboveYou: (role: string) =>
        `${role} steht nicht unter deiner höchsten Rolle, darum kannst du sie nicht vergeben.`,
    autoroleTooHigh: (role: string) =>
        `${role} steht über Nexos höchster Rolle. Zieh in den Servereinstellungen unter Rollen ` +
        `Nexos Rolle darüber.`,
    warned: (member: string, count: number) =>
        `${member} ist verwarnt. Verwarnungen bisher: ${count}.`,
    warningsNone: (member: string) => `${member} hat keine Verwarnungen.`,
    warningsNoneLeft: "Keine Verwarnungen mehr.",
    warningsTitle: (name: string) => `Verwarnungen von ${name}`,
    warningBy: "von",
    removeButton: "Entfernen",
    unwarnNotFound: (id: number) => `Auf diesem Server gibt es keine Verwarnung #${id}.`,
    timedOut: (member: string, until: string) => `${member} ist bis ${until} im Timeout.`,
    untimedOut: (member: string) => `${member} kann wieder schreiben.`,
    notTimedOut: (member: string) => `${member} ist nicht im Timeout.`,
    kicked: (member: string) => `${member} ist vom Server entfernt.`,
    banned: (user: string) => `${user} ist gebannt.`,
    unbanned: (user: string) => `Der Bann von ${user} ist aufgehoben.`,
    notBanned: (user: string) => `${user} ist nicht gebannt.`,
    notMember: (user: string) => `${user} ist nicht auf diesem Server.`,
    problemSelf: "Das kannst du nicht bei dir selbst tun.",
    problemNexo: "Das tut Nexo sich nicht selbst an.",
    problemOwner: "Das kann niemand beim Inhaber des Servers tun.",
    problemAboveYou: (member: string) =>
        `Die höchste Rolle von ${member} steht nicht unter deiner.`,
    problemAdmin: (member: string) =>
        `${member} ist Administrator, und Administratoren kann Discord nicht in den Timeout ` +
        "schicken.",
    problemNoPermission: (permission: string) =>
        `Nexo braucht dafür die Berechtigung „${permission}“.`,
    problemAboveNexo: (member: string) =>
        `Die höchste Rolle von ${member} steht nicht unter Nexos. ` +
        "Zieh in den Servereinstellungen unter Rollen Nexos Rolle darüber.",
    moderationPermissionNames: {
        timeout: "Mitglieder im Timeout",
        kick: "Mitglieder kicken, annehmen und ablehnen",
        ban: "Mitglieder bannen",
    },
    modlogSaved: (channel: string) =>
        `Moderationsaktionen werden jetzt in ${channel} protokolliert.`,
    modlogNoAuditLog:
        "Kicks, Banns und Timeouts direkt in Discord erscheinen dort, sobald Nexo das Audit-Log " +
        "einsehen darf; bis dahin nur Nexos Befehle.",
    modlogOff: "Das Mod-Log ist aus.",
    modlogPublic: "Achtung: Jedes Mitglied kann diesen Kanal lesen, auch die Gründe.",
    modlogPrefix: "Mod-Log:",
    modlogTitles: {
        warn: "Verwarnung",
        unwarn: "Verwarnung entfernt",
        timeout: "Timeout",
        untimeout: "Timeout beendet",
        kick: "Kick",
        ban: "Bann",
        unban: "Bann aufgehoben",
    },
    modlogMember: "Mitglied",
    modlogModerator: "Moderator",
    modlogUntil: "Bis",
    modlogWarning: "Verwarnung",
    modlogReason: "Grund",
    levelName: "Level",
    leaderboardTitle: "Bestenliste",
    leaderboardEmpty:
        "Noch hat niemand XP. Mitglieder sammeln sie, indem sie Nachrichten schreiben.",
    leaderboardYou: (place: number, level: number, xp: number) =>
        `Dein Platz: **${place}** · Level ${level} · ${xp} XP`,
    leaderboardNoXp: "Du hast noch keine XP. Du sammelst sie, indem du Nachrichten schreibst.",
    ticketPanelTitle: "Support",
    ticketPanelText:
        "Brauchst du Hilfe vom Team? Öffne ein Ticket: einen privaten Thread, den nur du und das " +
        "Team sehen.",
    ticketOpenButton: "Ticket öffnen",
    ticketCannotRun: (channel: string, missing: string) =>
        `Nexo kann in ${channel} noch keine Tickets führen. Gib ihm dort diese Berechtigungen: ` +
        `${missing}.`,
    ticketSetUp: (channel: string) =>
        `Der Ticket-Button ist in ${channel}. Wenn keine neuen Tickets mehr kommen sollen, lösch ` +
        "die Nachricht mit dem Button. Offene Tickets bleiben.",
    ticketTeamNotMentionable: (role: string) =>
        `Nexo erwähnt das Team in jedem Ticket, und du darfst ${role} nicht erwähnen. Mach die ` +
        "Rolle erwähnbar, oder frag jemanden, der alle Rollen erwähnen darf.",
    ticketUnavailable:
        "Nexo kann hier gerade keine Tickets öffnen. Sag dem Team bitte auf anderem Weg Bescheid.",
    ticketWarnEveryone: (channel: string) =>
        `Achtung: @everyone darf in ${channel} keine „Nachrichten in Threads senden“, also ` +
        "können Mitglieder in ihrem Ticket nicht schreiben. Erlaub es dort; der Kanal selbst " +
        "kann schreibgeschützt bleiben.",
    ticketWarnTeamSize: (role: string, channel: string) =>
        `Achtung: ${role} hat 100 oder mehr Mitglieder, darum fügt Discord sie nicht zu neuen ` +
        `Tickets hinzu. Wähl eine kleinere Rolle oder gib dem Team in ${channel} „Threads und ` +
        "Posts verwalten“, damit es alle Tickets sieht.",
    levelUpsHere:
        "Level-ups erscheinen jetzt dort, wo das Mitglied schreibt: bis Level 10 jedes Level, " +
        "danach jedes fünfte und jedes, das eine Rolle gibt.",
    levelUpsIn: (channel: string) =>
        `Level-ups erscheinen jetzt in ${channel}: bis Level 10 jedes Level, danach jedes fünfte ` +
        "und jedes, das eine Rolle gibt.",
    levelUpsOff: "Level-ups sind aus. Mitglieder sammeln weiter XP und bekommen ihre Level-Rollen.",
    levelsReset: (member: string) => `Die XP von ${member} beginnen wieder bei 0.`,
    levelroleAdded: (role: string, level: number) =>
        `Mitglieder bekommen ${role} ab Level ${level}. Wer schon darüber ist, bekommt sie mit ` +
        "der nächsten Nachricht.",
    levelroleRemoved: (role: string) => `${role} ist keine Level-Rolle mehr.`,
    levelroleNotThere: (role: string) => `${role} ist keine Level-Rolle.`,
    levelroleNone: (add: string) => `Noch keine Level-Rollen. Füge eine mit ${add} hinzu.`,
    levelroleListTitle: "Level-Rollen",
    dmTitles: {
        warn: (server: string) => `Verwarnung auf ${server}`,
        timeout: (server: string) => `Timeout auf ${server}`,
        kick: (server: string) => `Von ${server} entfernt`,
        ban: (server: string) => `Von ${server} gebannt`,
    },
    dmWarnings: "Verwarnungen bisher",
    dmKickNote: "Mit einer neuen Einladung kannst du wieder beitreten.",
    dmNoReply: "Antworten hier erreichen das Team nicht.",
    dmNotDelivered:
        "Das Mitglied hat keine Direktnachricht bekommen, weil es keine von diesem Server annimmt.",
    ticketTitle: "Ticket",
    ticketHello: (member: string) =>
        `${member}, schreib kurz, worum es geht. Das Team antwortet hier.`,
    ticketTeam: "Team",
    ticketCloseButton: "Ticket schließen",
    ticketClosedBy: (member: string) => `Geschlossen von ${member}.`,
    ticketOpened: (thread: string) => `Dein Ticket: ${thread}`,
    ticketAlreadyOpen: (thread: string) => `Du hast schon ein offenes Ticket: ${thread}`,
};
