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
