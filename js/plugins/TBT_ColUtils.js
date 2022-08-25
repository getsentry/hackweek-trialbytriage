/*:
 * @target MZ
 * @plugindesc Utilities for managing the colosseum gameplay loop of Trial by Triage
 * 
 * @help
 * 
 * @command reset_party
 * @text Reset Party Stats
 * @desc Removes any ephemereal growth gains from stats
*/

(() => {
    "use strict";

    const pluginName = "TBT_ColUtils";

    PluginManager.registerCommand(pluginName, "reset_party", () => {
        for (const actor of $gameActors._data) {
            if (!actor) {
                continue
            }
            // resets any run buffs
            actor._paramPlus = [0, 0, 0, 0, 0, 0, 0, 0];
        }
    });
})();