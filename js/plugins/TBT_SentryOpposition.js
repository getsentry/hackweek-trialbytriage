/*:
 * @target MZ
 * @plugindesc Create custom enemies from Sentry data
 * 
 * @help
 * 
 * This plugin consumes data downloaded by the TBT_SentryIntegration plugin and
 * uses it to create custom enemies based on the player's Sentry issues. It
 * modifies both the "Enemies" and "Troops" parts of the RPG Maker database, so
 * we use the word "opposition" to describe its output generally.
 *
 * The raw "Enemies" and "Troops" data from the RPG Maker database provide
 * template objects for this plugin. The majority of the enemies' game stats
 * are managed in RPG Maker. We want this plugin to handle only the minimum
 * needed complexity to add Sentry-derived details. One template object can be
 * copied and modified to generate many new objects.
 *
 * The `generate` command expects Sentry data to have been stored in a game
 * variable by the TST_SentryIntegration plugin. This operation is separate
 * from downloading so that we can nondeterministically generate different
 * opposition for separate colosseum runs, even if the player hasn't refreshed
 * their Sentry data. The generated data is stored in a game variable so that
 * it persists across saved games.
 *
 * The `apply` command loads the custom opposition data into the game state.
 * These changes do NOT persist across loading a saved game. So, we should
 * always assume that the game state has been clobbered (i.e., reverted to
 * template data) and call this command immediately before any game event that
 * depends on troop data.
 *
 * @command generate
 * @text Generate Opposition
 * @desc Use Sentry API data to create a new set of custom opposition data
 * 
 * @command apply
 * @text Apply Opposition
 * @desc Apply custom opposition data to the game database
 */

(() => {
    "use strict";

    const pluginName = "TBT_SentryOpposition";

    // ------------------------------------------------------------------------
    // Template Data I/O

    const loadTemplateData = () => {
        const storedData = TBT.Utils.getVariable(TBT.Utils.VARS.opp.templateData);
        if (storedData) {
            return JSON.parse(storedData);
        }

        // This object forms an interface with generateOpposition
        const templateData = {
            enemies: $dataEnemies,
            troops: $dataTroops,
        };
        console.log("raw: " + JSON.stringify(templateData));

        Object.keys(templateData).forEach((key) => {
            templateData[key] = templateData[key]
                .filter((element) => element != null)
                .map((element) => {
                    let deepCopy = JSON.parse(JSON.stringify(element));
                    delete deepCopy.id;
                    return deepCopy;
                });
        });
        TBT.Utils.setVariable(TBT.Utils.VARS.opp.templateData, JSON.stringify(templateData));
        return templateData;
    };

    // ------------------------------------------------------------------------
    // Opposition Game Logic

    const generateOpposition = (templateData, sentryData) => {

        for (let i = 0; i < Math.min(templateData.enemies.length, sentryData.length); i++) {
            templateData.enemies[i].name = sentryData[i].shortId;
        }

        // ***************************************
        // * TODO: Put cool stuff in here!!! :-D *
        // ***************************************

        // The returned object forms an interface with the "apply" command
        return {
            enemies: templateData.enemies,
            troops: templateData.troops,
        }
    };

    // ------------------------------------------------------------------------
    // Commands

    PluginManager.registerCommand(pluginName, "generate", () => {
        const sentryData = TBT.Utils.getVariable(TBT.Utils.VARS.sen.downloadedData);
        if (sentryData) {
            const opposition = generateOpposition(loadTemplateData(), JSON.parse(sentryData));
            if (opposition) {
                TBT.Utils.setVariable(TBT.Utils.VARS.opp.generatedData, JSON.stringify(opposition));
            }
        }
    });

    PluginManager.registerCommand(pluginName, "apply", () => {
        let generatedData = TBT.Utils.getVariable(TBT.Utils.VARS.opp.generatedData);
        if (generatedData) {
            generatedData = JSON.parse(generatedData);
            $dataEnemies = TBT.Utils.normalizeGameDataArray(generatedData.enemies);
            $dataTroops = TBT.Utils.normalizeGameDataArray(generatedData.troops);
            TBT.Utils.setVariable(TBT.Utils.VARS.opp.troopCount, $dataTroops.length);
        }
    });
})();
