const { getModule, React } = require("powercord/webpack");
const { inject, uninject } = require("powercord/injector");
const { Plugin } = require("powercord/entities");

module.exports = class MuteFolder extends Plugin {
    async startPlugin() {
        const menu = await getModule(["MenuItem"]);
        const GuildFolderContextMenu = await getModule((m) => m.default && m.default.displayName === "GuildFolderContextMenu");
        const getGuildFolderById = (await getModule(["getGuildFolderById"])).getGuildFolderById;
        const updateGuildNotificationSettings = (await getModule(["updateGuildNotificationSettings"])).updateGuildNotificationSettings;

        inject("mute-folder", GuildFolderContextMenu, "default", (args, res) => {
            res.props.children.unshift(
                React.createElement(menu.MenuItem, {
                    id: "mute-folder",
                    label: "Mute folder",
                    disabled: !args[0].unread,
                    action: () => {
                        const currFolder = getGuildFolderById(args[0].folderId);

                        for (const guild of currFolder.guildIds) {
                            updateGuildNotificationSettings(guild, { muted: true, suppress_everyone: true, suppress_roles: true });
                        }

                        powercord.api.notices.sendToast("mute-folder-success", {
                            header: "Done!",
                            content: `Muted ${currFolder.guildIds.length} guild(s) in ${currFolder.folderName}`,
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
                    disabled: args[0].unread,
                    action: () => {
                        const currFolder = getGuildFolderById(args[0].folderId);

                        for (const guild of currFolder.guildIds) {
                            updateGuildNotificationSettings(guild, { muted: false, suppress_everyone: false, suppress_roles: false });
                        }

                        powercord.api.notices.sendToast("unmute-folder-success", {
                            header: "Done!",
                            content: `Unmuted ${currFolder.guildIds.length} guild(s) in ${currFolder.folderName}`,
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
