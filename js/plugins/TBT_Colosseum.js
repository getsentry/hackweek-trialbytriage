/*:
 * @target MZ
 * @plugindesc Utilities for managing the colosseum gameplay loop
 * 
 * @help
 * 
 * @command reset_party
 * @text Reset Party Stats
 * @desc Removes any ephemereal growth gains from stats
*/

var TBT = TBT || {};
TBT.ColUtils = TBT.ColUtils || {};

(() => {
    "use strict";

    const pluginName = "TBT_Colosseum";

    PluginManager.registerCommand(pluginName, "reset_party", () => {
        for (const actor of $gameActors._data) {
            if (!actor) {
                continue
            }
            // resets any run buffs
            actor._paramPlus = [0, 0, 0, 0, 0, 0, 0, 0];
        }
    });

    TBT.ColUtils.calculateRunReward = () => {
        const winCount = TBT.Utils.getVariable(TBT.Utils.VARS.col.winCount);
        return (winCount <= 0) ? 0
            : Math.round(10 * (winCount + 0.1 * Math.pow(winCount - 1, 2)));
    };
})();