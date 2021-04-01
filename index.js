const { getModule, React } = require("powercord/webpack");
const { inject, uninject } = require("powercord/injector");
const { Plugin } = require("powercord/entities");

module.exports = class MuteFolder extends Plugin {
    async startPlugin() {
        const menu = await getModule(["MenuItem"]);
        const GuildFolderContextMenu = await getModule((m) => m.default && m.default.displayName === "GuildFolderContextMenu");
        const { getGuildFolderById } = await getModule(["getGuildFolderById"]);
        const { updateGuildNotificationSettings } = await getModule(["updateGuildNotificationSettings"]);
        const { getState } = await getModule(["getMuteConfig"]);

        inject("mute-folder", GuildFolderContextMenu, "default", (args, res) => {
            const currFolder = getGuildFolderById(args[0].folderId);
            const unmutedGuilds = Object.values(getState().userGuildSettings).filter((g) => currFolder.guildIds.includes(g.guild_id) && (!g.muted || !g.suppress_everyone || !g.suppress_roles));
            const mutedGuilds = Object.values(getState().userGuildSettings).filter((g) => currFolder.guildIds.includes(g.guild_id) && g.muted && g.suppress_everyone && g.suppress_roles);

            res.props.children.unshift(
                React.createElement(menu.MenuItem, {
                    id: "mute-folder",
                    label: "Mute folder",
                    disabled: mutedGuilds.length === currFolder.guildIds.length,
                    action: () => {
                        for (const guild of unmutedGuilds) {
                            updateGuildNotificationSettings(guild.guild_id, { muted: true, suppress_everyone: true, suppress_roles: true });
                        }

                        powercord.api.notices.sendToast("mute-folder-success", {
                            header: "Done!",
                            content: `Muted ${unmutedGuilds.length} guild(s) in ${currFolder.folderName || "Folder"}`,
                            type: "success",
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
                    label: "Unmute folder",
                    disabled: unmutedGuilds.length === currFolder.guildIds.length,
                    action: () => {
                        for (const guild of mutedGuilds) {
                            updateGuildNotificationSettings(guild.guild_id, { muted: false, suppress_everyone: false, suppress_roles: false });
                        }

                        powercord.api.notices.sendToast("unmute-folder-success", {
                            header: "Done!",
                            content: `Unmuted ${mutedGuilds.length} guild(s) in ${currFolder.folderName || "Folder"}`,
                            type: "success",
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
