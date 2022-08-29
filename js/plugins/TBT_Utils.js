/*:
 * @target MZ
 * @plugindesc Utilities for Trial by Triage
 */

var TBT = TBT || {};
TBT.Utils = TBT.Utils || {};

(() => {
    "use strict";

    /*
     * Registry of game variables used by TBT plugins.
     *
     * Not every game variable needs to be registered here: only ones touched by
     * our plugin node, not ones that are written and read only within events.
     *
     * For code cleanliness, never refer to a game variable by its "magic
     * number". Use the utility functions below to get and set values. Refer to
     * the variable ID either as a value in the table below, or by a string
     * matching its human-readable nmae from the event UI.
     *
     * For convenience, we group variables into pages of length 20, because
     * that's how they're shown in the event UI.
     */
    TBT.Utils.VARS = {
        /*
         * SEN: Variables related to the TBT_SentryIntegration plugin for
         * connecting to the Sentry API and making a request to it.
         */
        sen: {
            downloadedData: 1,
            downloadStatus: 2,
            serverAddress: 3,
            authToken: 4,
            orgSlug: 5,
            userEmail: 6,
            downloadTimestamp: 7,
        },

        /*
         * OPP: Variables related to the TBT_SentryOpposition plugin for creating
         * dynamic opposition (enemies and troops).
         */
        opp: {
            templateData: 21,
            generatedData: 22,
        },

        /*
         * COL: Variables related to the loop of battles spawned by talking to
         * the Battlemaster in the Colosseum
         */
        col: {
            winCount: 41,
            nextTroop: 42,
            maxWins: 43,
            troopSchedule: 44,
        },

        // CUR: Variables related to the currency system
        cur: {
            currencyState: 81,
            ephemeralBalance: 82,
            permanentBalance: 83,
        },
    };

    /**
     * Convert a variable's name to its index number.
     * 
     * @param {number | string} variableId the name or number of the variable to get
     * @returns the variable's numeric index
     */
    TBT.Utils.getVariableIndex = (variableId) => {
        if (typeof variableId === "number") {
            return variableId;
        }
        for (const i in $dataSystem.variables) {
            if ($dataSystem.variables[i] === variableId) {
                return i;
            }
        }
        throw "Unmatched variableId: " + variableId;
    }

    /**
     * Get a game variable's value.
     * 
     * @param {number | string} variableId the name or number of the variable to get
     */
    TBT.Utils.getVariable = (variableId) => {
        return $gameVariables.value(TBT.Utils.getVariableIndex(variableId));
    };

    /**
     * Set a game variable's value.
     * 
     * @param {number | string} variableId the name or number of the variable to set
     * @param {*} value the value to assign
     */
    TBT.Utils.setVariable = (variableId, value) => {
        $gameVariables.setValue(TBT.Utils.getVariableIndex(variableId), value);
    };

    /**
     * Set up an array to be stored in the RPG Maker database.
     *
     * RPG Maker likes to start counting IDs at 1 and to have the array index
     * match, so its arrays are padded with a null value at index 0. Add the
     * null padding if it's not already there, and set the "id" property on each
     * object to match its array index.
     *
     * @param {Object[]} gameDataArray an array of game data
     * @returns the normalized array
     */
    TBT.Utils.normalizeGameDataArray = (gameDataArray) => {
        let normalArray = [...gameDataArray];
        if (normalArray.length === 0 || normalArray[0] != null) {
            normalArray.unshift(null);
        }
        for (const i in normalArray) {
            if (i > 0) {
                normalArray[i].id = i;
            }
        }
        return normalArray;
    };

    // ------------------------------------------------------------------------
    // Loading Hooks

    TBT.Utils.GAME_LOAD_ACTIONS = []

    TBT.Utils.registerGameLoadAction = (callback) => {
        TBT.Utils.GAME_LOAD_ACTIONS.push(callback);
    };

    const _DataManager__extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function (contents) {
        _DataManager__extractSaveContents(contents);
        for (const action of TBT.Utils.GAME_LOAD_ACTIONS) {
            action();
        }
    };

})();
