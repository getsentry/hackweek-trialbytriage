/*:
 * @target MZ
 * @plugindesc Swap between ephemeral and permanent currency
 * 
 * @command swap
 * @text Swap Currency
 * @desc Swap the currency state and change the player's balance.
 * @arg state
 * @type number
 * @desc The currency state to switch to.
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

(() => {
    "use strict";

    const pluginName = "TBT_CurrencySwap";

    // State values for currencyState game var. Starts as 0.
    const STATES = [
        {
            value: 1,
            unitName: "Bits",
            balanceVar: TBT.Utils.VARS.cur.ephemeralBalance,
        },
        {
            value: 2,
            unitName: "Gold",
            balanceVar: TBT.Utils.VARS.cur.permanentBalance,
        },
    ]

    const getState = (stateNumber) => {
        if (stateNumber == 0) {
            return STATES[0]; // ephemeral is default initial state
        }
        return STATES.filter(s => s.value == stateNumber)[0];
    };

    const setCurrencyUnitNameInSystem = () => {
        const state = getState(TBT.Utils.getVariable(TBT.Utils.VARS.cur.currencyState));
        $dataSystem.currencyUnit = state.unitName;
    };

    PluginManager.registerCommand(pluginName, "swap", (args) => {
        const previousState = getState(TBT.Utils.getVariable(TBT.Utils.VARS.cur.currencyState));
        const oldBalance = $gameParty.gold();
        TBT.Utils.setVariable(previousState.balanceVar, oldBalance);

        const newState = getState(args.state);
        TBT.Utils.setVariable(TBT.Utils.VARS.cur.currencyState, newState.value);
        const newBalance = TBT.Utils.getVariable(newState.balanceVar);
        $gameParty.gainGold(newBalance - oldBalance);

        setCurrencyUnitNameInSystem();
    });

    TBT.Utils.registerGameLoadAction(setCurrencyUnitNameInSystem);
})();
