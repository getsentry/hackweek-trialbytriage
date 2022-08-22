/*:
 * @target MZ
 * @plugindesc Connect to a remote Sentry API
 *
 * @command open_menu
 * @text Open Remote Config Menu
 * @desc Open menu for configuring the remote connection to a Sentry API.
 *
 * @command fetch
 * @text Fetch Sentry Issues
 * @desc Fire a live request to the Sentry API if the needed config values are
 *       present. In the `sen.downloadedData` variable, store the response
 *       data.  In the `sen.downloadStatus` variable, save an integer
 *       representing whether the download is in progress, successful, or
 *       failed.
 */

var TBT = TBT || {};
TBT.SentryIntegration = TBT.SentryIntegration || {};

(() => {
    "use strict";

    const pluginName = "TBT_SentryIntegration";

    // ------------------------------------------------------------------------
    // Configuration menu for connecting to remote Sentry API

    function Scene_RemoteConfig() {
        this.initialize(...arguments);
    }

    Scene_RemoteConfig.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_RemoteConfig.prototype.constructor = Scene_RemoteConfig;

    Scene_RemoteConfig.prototype.initialize = function () {
        Scene_MenuBase.prototype.initialize.call(this);
    };

    Scene_RemoteConfig.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);
        this.createRemoteConfigWindow();
    };

    Scene_RemoteConfig.prototype.terminate = function () {
        Scene_MenuBase.prototype.terminate.call(this);
        ConfigManager.save();
    };

    Scene_RemoteConfig.prototype.createRemoteConfigWindow = function () {
        const rect = this.remoteConfigWindowRect();
        this._remoteConfigWindow = new Window_RemoteConfig(rect);
        this._remoteConfigWindow.setHandler("cancel", this.popScene.bind(this));
        this.addWindow(this._remoteConfigWindow);
    };

    Scene_RemoteConfig.prototype.remoteConfigWindowRect = function () {
        const n = Window_RemoteConfig.prototype.menuEntries.length;
        const ww = 400;
        const wh = this.calcWindowHeight(n, true);
        const wx = (Graphics.boxWidth - ww) / 2;
        const wy = (Graphics.boxHeight - wh) / 2;
        return new Rectangle(wx, wy, ww, wh);
    };

    function Window_RemoteConfig() {
        this.initialize(...arguments);
    }

    Window_RemoteConfig.prototype = Object.create(Window_Options.prototype);
    Window_RemoteConfig.prototype.constructor = Window_RemoteConfig;

    Window_RemoteConfig.prototype.initialize = function (rect) {
        Window_Command.prototype.initialize.call(this, rect);
    };

    Window_RemoteConfig.prototype.menuEntries = [
        {
            symbol: "server_address",
            label: "Server Address",
            var: TBT.Utils.VARS.sen.serverAddress,
            default: "https://sentry.io/",
        },
        {
            symbol: "auth_token",
            label: "Auth Token",
            var: TBT.Utils.VARS.sen.authToken,
        },
        {
            symbol: "org_slug",
            label: "Organization Slug",
            var: TBT.Utils.VARS.sen.orgSlug,
            default: "sentry",
        },
        {
            symbol: "email",
            label: "Email Address",
            var: TBT.Utils.VARS.sen.userEmail,
        },
    ]

    Window_RemoteConfig.prototype.makeCommandList = function () {
        for (const menuEntry of this.menuEntries) {
            this.addCommand(menuEntry.label, menuEntry.symbol);
            if (menuEntry.default && !TBT.Utils.getVariable(menuEntry.var)) {
                TBT.Utils.setVariable(menuEntry.var, menuEntry.default);
            }
        }
    };

    Window_RemoteConfig.prototype.getConfigValue = function (symbol) {
        const menuEntry = this.menuEntries.filter((item) => item.symbol === symbol)[0];
        const value = TBT.Utils.getVariable(menuEntry.var);
        return value;
    };

    Window_RemoteConfig.prototype.statusText = function (index) {
        const symbol = this.commandSymbol(index);
        const value = this.getConfigValue(symbol);
        return value ? "\u2611" : "\u2610";
    };

    Window_RemoteConfig.prototype.processOk = function () {
        const index = this.index();
        const symbol = this.commandSymbol(index);
        const value = this.getConfigValue(symbol);

        const menuEntry = this.menuEntries.filter((item) => item.symbol === symbol)[0];

        PluginManager.callCommand(this, "RS_InputDialog", "text", {
            text: menuEntry.label
        });
        PluginManager.callCommand(this, "RS_InputDialog", "variableID", {
            number: TBT.Utils.getVariableIndex(menuEntry.var)
        });
        PluginManager.callCommand(this, "RS_InputDialog", "open");
    };

    // ------------------------------------------------------------------------
    // Insert a "Remote" button into the default escape menu

    Window_MenuCommand.prototype.makeCommandList = function () {
        this.addMainCommands();
        this.addFormationCommand();
        this.addOriginalCommands();
        this.addOptionsCommand();
        this.addCommand("Remote", "remote", true);
        this.addSaveCommand();
        this.addGameEndCommand();
    };

    Scene_Menu.prototype.createCommandWindow = function () {
        const rect = this.commandWindowRect();
        const commandWindow = new Window_MenuCommand(rect);
        commandWindow.setHandler("item", this.commandItem.bind(this));
        commandWindow.setHandler("skill", this.commandPersonal.bind(this));
        commandWindow.setHandler("equip", this.commandPersonal.bind(this));
        commandWindow.setHandler("status", this.commandPersonal.bind(this));
        commandWindow.setHandler("formation", this.commandFormation.bind(this));
        commandWindow.setHandler("options", this.commandOptions.bind(this));
        commandWindow.setHandler("remote", this.commandRemote.bind(this));
        commandWindow.setHandler("save", this.commandSave.bind(this));
        commandWindow.setHandler("gameEnd", this.commandGameEnd.bind(this));
        commandWindow.setHandler("cancel", this.popScene.bind(this));
        this.addWindow(commandWindow);
        this._commandWindow = commandWindow;
    };

    Scene_Menu.prototype.commandRemote = function () {
        PluginManager.callCommand(this, pluginName, "open_menu");
    };


    // ------------------------------------------------------------------------
    // Commands

    PluginManager.registerCommand(pluginName, "open_menu", () => {
        SceneManager.push(Scene_RemoteConfig);
    });

    PluginManager.registerCommand(pluginName, "fetch", () => {
        const server = TBT.Utils.getVariable(TBT.Utils.VARS.sen.serverAddress);
        const authToken = TBT.Utils.getVariable(TBT.Utils.VARS.sen.authToken);
        const orgSlug = TBT.Utils.getVariable(TBT.Utils.VARS.sen.orgSlug);
        if (!(server && authToken && orgSlug)) {
            TBT.Utils.setVariable(TBT.Utils.VARS.sen.downloadStatus, 2);
        }

        // TODO: Let the player customize the parameters on this query?
        const address = server + "api/0/organizations/" + orgSlug
            + "/issues/"
            + "?collapse=stats&expand=owners&expand=inbox&limit=2"
            + "&query=is%3Aunresolved&shortIdLookup=1&statsPeriod=1h";

        fetch(new Request(
            "proxy",
            {
                method: 'POST',
                body: JSON.stringify({
                    method: 'GET',
                    address: address,
                    headers: {
                        Authorization: "Bearer " + authToken,
                    },
                }),
            }
        )).then((response) => {
            // TODO: Handle error statuses
            return response.text();
        }).then((text) => {
            TBT.Utils.setVariable(TBT.Utils.VARS.sen.downloadStatus, 1);
            TBT.Utils.setVariable(TBT.Utils.VARS.sen.downloadedData, text);
        });
    });

    TBT.SentryIntegration.isReadyToConnect = () => {
        return TBT.Utils.getVariable(TBT.Utils.VARS.sen.serverAddress)
            && TBT.Utils.getVariable(TBT.Utils.VARS.sen.authToken)
            && TBT.Utils.getVariable(TBT.Utils.VARS.sen.orgSlug);
    };

    TBT.SentryIntegration.isDataDownloaded = () => {
        return TBT.Utils.getVariable(TBT.Utils.VARS.sen.downloadedData);
    };
})();
