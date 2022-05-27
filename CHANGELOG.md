# Update 4.0.0

## Note
This update might be be the last major update that uses Discord.js v12.
I will now try to use v13 for future versions.
This branch will still be updated for bug fixes.

## Commands
### APIs
- Added `TetrioStats.js` because I play that game, and there was an API for it.
- Removed `Trivia.js` because my attempt on making that command was very scuffed.
- `UrbanDictionary.js` now uses `URLSearchParams` instead of `querystring`.

### Music
- The volume bar for `ChangeVolume.js` is now horizontal instead of vertical.
- Added `HideNewSongs.js`. The command disables the messages that appear when a new song is played.
- Two Changes for `PlayMusic.js`
- - The command now uses the `ytpl` and `ytsr` packages for playlist and and search functionality.
- - The `playSong()` function is now moved to its own file. Why did I do this?
- The reactions on `ToggleLoop.js` now indicate the loop type (off, queue, track).

### Other
- `TestConnection.js` now shows the time the bot has started. Its hard to read though. Might fix later.

## Listeners
- The interval for the switching of activities can now be set easily on `Others/Activities.json`


