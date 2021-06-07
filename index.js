const { getModule, React, i18n: { Messages } } = require("powercord/webpack");
const { inject, uninject } = require("powercord/injector");
const { Plugin } = require("powercord/entities");

const i18n = require("./i18n");

module.exports = class MuteFolder extends Plugin {
    async startPlugin() {
        powercord.api.i18n.loadAllStrings(i18n);

        const menu = await getModule(["MenuItem"]);
        const GuildFolderContextMenu = await getModule((m) => m.default && m.default.displayName === "GuildFolderContextMenu");
        const { getGuildFolderById } = await getModule(["getGuildFolderById"]);
        const { updateGuildNotificationSettings } = await getModule(["updateGuildNotificationSettings"]);
        const { isMuted } = await getModule(["getMuteConfig"]);

        inject("mute-folder", GuildFolderContextMenu, "default", (args, res) => {
            const currFolder = getGuildFolderById(args[0].folderId);

            const unmutedGuilds = currFolder.guildIds.filter((g) => !isMuted(g));
            const mutedGuilds = currFolder.guildIds.filter((g) => isMuted(g));

            res.props.children.unshift(
                React.createElement(menu.MenuItem, {
                    id: "mute-folder",
                    label: Messages.MTF_MUTE_LABEL,
                    disabled: mutedGuilds.length === currFolder.guildIds.length,
                    action: () => {
                        for (const guild of unmutedGuilds) {
                            updateGuildNotificationSettings(guild, { muted: true, suppress_everyone: true, suppress_roles: true });
                        }

                        powercord.api.notices.sendToast("mute-folder-success", {
                            header: "Done!",
                            content: `Muted ${unmutedGuilds.length} guild(s) in ${currFolder.folderName || "Folder"}`,
                            type: "success",
                            timeout: 10e3,
                            buttons: [
                                {
                                    text: "OK",
                                    color: "green",
                                    size: "small",
                                    look: "outlined"
                                }
                            ]
                        });
                    }
                }),
                React.createElement(menu.MenuItem, {
                    id: "unmute-folder",
                    label: Messages.MTF_UNMUTE_LABEL,
                    disabled: unmutedGuilds.length === currFolder.guildIds.length,
                    action: () => {
                        for (const guild of mutedGuilds) {
                            updateGuildNotificationSettings(guild, { muted: false, suppress_everyone: false, suppress_roles: false });
                        }

                        powercord.api.notices.sendToast("unmute-folder-success", {
                            header: "Done!",
                            content: `Unmuted ${mutedGuilds.length} guild(s) in ${currFolder.folderName || "Folder"}`,
                            type: "success",
                            timeout: 10e3,
                            buttons: [
                                {
                                    text: "OK",
                                    color: "green",
                                    size: "small",
                                    look: "outlined"
                                }
                            ]
                        });
                    }
                })
            );
            return res;
        });

        GuildFolderContextMenu.default.displayName = "GuildFolderContextMenu";
    }

    pluginWillUnload() {
        uninject("mute-folder");
    }
};
