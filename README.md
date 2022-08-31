# Trial by Triage

_Trial by Triage_ is a fun accessory to the Sentry platform that was made as a
Hackweek project in 2022. It is a JRPG-styled video game where the enemies are
based on issues from the player's Sentry feed.

## Licensing

This game was produced using _RPG Maker MZ_, a product of Gotcha Gotcha Games
Inc., and incorporates assets that are **©Gotcha Gotcha Games Inc./YOJI OJIMA
2020**. Their use and distribution are governed by the [RPG Maker MZ User
License Agreement][eula].

  [eula]: https://www.rpgmakerweb.com/eula

## How to Play

The game is hosted at https://tbt.sentry.gg/ and can be played locally.

The game's code needs to communicate with a remote Sentry API in order to
function. It cannot make a cross-origin call directly to the Sentry API, so
instead it uses a proxy server. To test or play the game from local source, run
the proxy server with the command

    node server.js

and point your browser at `http://localhost:5000/` or the correct port.

Using Chrome is recommended. The core scripts exported from RPG Maker seem to
have a bug when the game is played in Firefox, where it displays the message:
"Your browser does not allow to read local files." This failure mode is meant,
if you load the base HTML page from local storage, to indicate that the
browser's policy is preventing the game from loading other local files as
assets. As far as we can tell, something about the asset loading order causes
the game to throw this error spuriously, and isn't specific to _Trial by Triage_
or the way we're hosting it.

## Security Considerations

If you input a Sentry API key to _Trial by Triage_, both it and the issue data
is downloads are stored in plaintext and stored as part of your saved games,
including autosaves. Saved game data is stored as cookies on the `tbt.sentry.gg`
or `localhost` domain, as applicable. Never input an API key on a shared or
untrusted device. However, _Trial by Triage_ should be safe to play on a private
device, especially with local disk encryption.

To reduce risk, use an API key with no permission scopes other than
`event:read`.

## Project Pages

* https://hackweek.getsentry.net/projects/-N9cuZc1jwiHqFNH0dZF/an-rpg-where-you-fight-monsters-based-on-issues-from-your-sentry-feed
* https://www.notion.so/sentry/Hackweek-Trial-by-Triage-6e0ebc9230c640d9a9333fb5dc943ed1
