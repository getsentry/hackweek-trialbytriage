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

/*
 * This plugin is licensed as follows:
 *
 *     Copyright 2022 Functional Software, Inc. dba Sentry
 *
 *     Permission is hereby granted, free of charge, to any person obtaining a
 *     copy of this software and associated documentation files (the
 *     "Software"), to deal in the Software without restriction, including
 *     without limitation the rights to use, copy, modify, merge, publish,
 *     distribute, sublicense, and/or sell copies of the Software, and to
 *     permit persons to whom the Software is furnished to do so, subject to
 *     the following conditions:
 *
 *     The above copyright notice and this permission notice shall be included
 *     in all copies or substantial portions of the Software.
 *
 *     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 *     OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *     MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 *     IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 *     CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 *     TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 *     SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Note that this license applies ONLY to this source code file and similarly
 * labeled files, and not necessarily to other files in the same directory or
 * repository. This software is integrated with RPG Maker MZ assets whose use
 * and distribution are governed by the RPG Maker MZ User License Agreement at
 *     https://www.rpgmakerweb.com/eula
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