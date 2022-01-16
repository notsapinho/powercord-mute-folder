const {
	getModule,
	React,
	i18n: { Messages }
} = require("powercord/webpack");
const { inject, uninject } = require("powercord/injector");
const { Plugin } = require("powercord/entities");

const { MenuGroup, MenuItem } = getModule(["MenuGroup", "MenuItem"], false);
const { getGuildFolderById } = getModule(["getGuildFolderById"], false);
const { isMuted } = getModule(["getMuteConfig"], false);

const i18n = require("./i18n");

module.exports = class MuteFolder extends Plugin {
	startPlugin() {
		powercord.api.i18n.loadAllStrings(i18n);

		this.patchContextMenu("GuildFolderContextMenu", (GuildFolderContextMenu) => {
			inject("mute-folder-context-menu-lazy", GuildFolderContextMenu, "default", (args, res) => {
				const currFolder = getGuildFolderById(args[0].folderId);

				const unmutedGuilds = currFolder.guildIds.filter((g) => !isMuted(g));
				const mutedGuilds = currFolder.guildIds.filter((g) => isMuted(g));

				res.props.children.unshift(
					<MenuGroup>
						<MenuItem
							disabled={mutedGuilds.length === currFolder.guildIds.length}
							id="mute-folder"
							label={Messages.MTF_MUTE_LABEL}
							action={() => {
								this.updateGuilds(unmutedGuilds);
							}}
						/>
						<MenuItem
							disabled={unmutedGuilds.length === currFolder.guildIds.length}
							id="unmute-folder"
							label={Messages.MTF_UNMUTE_LABEL}
							action={() => this.updateGuilds(mutedGuilds, false)}
						/>
					</MenuGroup>
				);

				return res;
			});

			GuildFolderContextMenu.default.displayName = "GuildFolderContextMenu";
		});
	}

	patchContextMenu(displayName, patch) {
		const filter = (m) => m.default && m.default.displayName === displayName;
		const m = getModule(filter, false);
		if (m) patch(m);
		else {
			const module = getModule(["openContextMenuLazy"], false);
			inject(
				"mute-folder-context-menu-lazy",
				module,
				"openContextMenuLazy",
				(args) => {
					const lazyRender = args[1];
					args[1] = async () => {
						const render = await lazyRender(args[0]);

						return (config) => {
							const menu = render(config);
							if (menu?.type?.displayName === displayName && patch) {
								uninject("mute-folder-context-menu-lazy");
								patch(getModule(filter, false));
								patch = false;
							}
							return menu;
						};
					};
					return args;
				},
				true
			);
		}
	}

	updateGuilds(guilds, bool = true) {
		for (const guild of guilds) {
			updateGuildNotificationSettings(guild, { muted: bool, suppress_everyone: bool, suppress_roles: bool });
		}
	}

	pluginWillUnload() {
		uninject("mute-folder");
		uninject("mute-folder-context-menu-lazy");
	}
};
