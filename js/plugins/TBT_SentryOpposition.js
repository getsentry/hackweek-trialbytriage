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
 * 
 * @command setNextTroop
 * @text Set Next Troop
 * @desc Set the ID of the next troop to fight in the Colosseum
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

    const pluginName = "TBT_SentryOpposition";

    /**
     * Shuffle a segment in parallel arrays identically.
     *
     * @param {Object[Object[]]} arrays an array of the arrays to shuffle
     * @param {number} lowerBound the segment's lower bound, inclusive
     * @param {number} upperBound the segment's upper bound, exclusive
     */
    const shuffleArraySegments = (arrays, lowerBound, upperBound) => {
        let size;
        while ((size = upperBound - lowerBound) > 0) {
            const index = Math.floor(Math.random() * size) + lowerBound;
            for (const array of arrays) {
                const swap = array[index];
                array[index] = array[lowerBound];
                array[lowerBound] = swap;
            }
            lowerBound++;
        }
    };

    /**
     * Randomly reorder the elements of an array.
     *
     * @param {Object[]} array the array to shuffle (not modified)
     * @returns a shuffled copy of the array
     */
    const shuffleArray = (array) => {
        const copy = [...array];
        shuffleArraySegments([copy], 0, copy.length);
        return copy;
    };

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

    const isFrontendIssue = (issue) => issue.platform === 'javascript';

    const FRONTEND_TYPE = 10;
    const BACKEND_TYPE = 11;
    const generateTypeModifier = (typeId, modifier) => ({
        code: 11,
        dataId: typeId,
        value: modifier,
    });

    const mapSentryDataToEnemy = (enemy, troop, issue) => {
        const shortId = issue.shortId;
        const title = issue.title;
        const level = issue.level;
        const platform = issue.platform; // TODO: use for speech bubble
        let errorCount = 0;
        const issueStats = issue.stats["24h"];
        for (let i = 0; i < issueStats.length; ++i) {
            errorCount += issueStats[i][1];
        }

        // https://stackoverflow.com/a/11675520/2160657
        const title_wrapped = (title + ' ').replace(/(\S(.{0,45}\S)?)\s+/g, '$1\n').trim()

        // set enemy name
        enemy.name = shortId ? shortId : title.split(": ")[0];
        // set enemy type
        if (isFrontendIssue(issue)) {
            // weakness to frontend attacks
            enemy.traits.push(generateTypeModifier(FRONTEND_TYPE, 2));
            // resistant to backend attacks
            enemy.traits.push(generateTypeModifier(BACKEND_TYPE, 0.5));
        } else {
            // weakness to backend attacks
            enemy.traits.push(generateTypeModifier(BACKEND_TYPE, 2));
            // resistant to frontend attacks
            enemy.traits.push(generateTypeModifier(FRONTEND_TYPE, 0.5));
        }
        // set troop dialogue
        troop.pages[0].conditions.turnValid = true;
        troop.pages[0].conditions.turnA = 0;
        troop.pages[0].list.unshift(
            {
                "code": 101,
                "indent": 0,
                parameters: [
                    "", // headshot
                    0,
                    0,
                    2,
                    level // text title
                ]
            },
            {
                "code": 401,
                "indent": 0,
                parameters: [
                    title_wrapped, // text dialogue
                ]
            }
        );
        return [enemy, troop];
    }

    const COLOSSEUM_TIERS = [
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 10, 11, 12],
        [13, 14, 15, 16, 17, 18],
        [19, 20, 21, 22, 23, 24],
        [25, 26, 27, 28, 29, 30],
    ];

    const setColosseumSchedule = () => {
        let schedule = [];
        for (let tier of COLOSSEUM_TIERS) {
            tier = shuffleArray(tier);
            schedule = schedule.concat(tier);
        }

        TBT.Utils.setVariable(TBT.Utils.VARS.col.troopSchedule, JSON.stringify(schedule));
        TBT.Utils.setVariable(TBT.Utils.VARS.col.maxWins, schedule.length);
        TBT.Utils.setVariable(TBT.Utils.VARS.col.nextTroop, schedule[0]);
        return schedule;
    };

    const generateOpposition = (templateData, sentryData) => {
        const enemies = [...templateData.enemies];
        const troops = [...templateData.troops];

        sentryData = shuffleArray(sentryData);
        const colosseumSchedule = setColosseumSchedule();

        for (let i = 0; i < Math.min(colosseumSchedule.length, sentryData.length); i++) {
            const troopIndex = colosseumSchedule[i] - 1;
            const troop = troops[troopIndex];
            const enemyIndex = troop.members[0].enemyId - 1;
            const enemy = enemies[enemyIndex];

            const [mappedEnemy, mappedTroop] = mapSentryDataToEnemy(enemy, troop, sentryData[i]);
            enemies[enemyIndex] = mappedEnemy;
            troops[troopIndex] = mappedTroop;
        }

        // The returned object forms an interface with the "apply" command
        return { enemies, troops }
    };

    // ------------------------------------------------------------------------
    // Commands

    PluginManager.registerCommand(pluginName, "generate", () => {
        const sentryData = TBT.Utils.getVariable(TBT.Utils.VARS.sen.downloadedData);
        const sentryDataObj = sentryData ? JSON.parse(sentryData) : [];
        const opposition = generateOpposition(loadTemplateData(), sentryDataObj);
        TBT.Utils.setVariable(TBT.Utils.VARS.opp.generatedData, JSON.stringify(opposition));
    });

    PluginManager.registerCommand(pluginName, "apply", () => {
        let generatedData = TBT.Utils.getVariable(TBT.Utils.VARS.opp.generatedData);
        if (generatedData) {
            generatedData = JSON.parse(generatedData);
            $dataEnemies = TBT.Utils.normalizeGameDataArray(generatedData.enemies);
            $dataTroops = TBT.Utils.normalizeGameDataArray(generatedData.troops);
        }
    });

    PluginManager.registerCommand(pluginName, "setNextTroop", () => {
        const troopSchedule = JSON.parse(TBT.Utils.getVariable(TBT.Utils.VARS.col.troopSchedule));
        const winCount = TBT.Utils.getVariable(TBT.Utils.VARS.col.winCount);
        TBT.Utils.setVariable(TBT.Utils.VARS.col.nextTroop, troopSchedule[winCount]);
    });
})();
