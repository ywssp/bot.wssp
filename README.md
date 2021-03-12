# Bot.wssp

This is an open-source discord bot that you can invite and even suggest commands to! Pretty neat huh?

UPDATE: I'm currently at school, so i can't fix bugs all the time.

## .env contents

### process.env.TOKEN

The token of the bot
Used in [start.js](start.js).

### process.env.OWNER

The user id of the owner/s
Used in [start.js](start.js).

### process.env.YOUTUBE

The api key of the bot
Used in [Commands/Music/PlayMusic.js](./Commands/Music/PlayMusic.js).

### process.env.PREFIX

The prefix that the bot uses. Multiple prefixes are seperated using `|`
Used in [start.js](start.js).

your `.env` file should look like this:

```shell
TOKEN=NzIwNjA1ODE4MzgyMzE5Njk4.XuIadw.kjtUXvBOzzTxepM_R3y5eW7mBnc
YOUTUBE=AIzaSyDfNuFz4A8O7oliOGqVdtrJCsjFbYpBqCU
OWNER=689607114011705439
PREFIX='+|!|/'
```

## NPM Packages and services used

### Discord

-   [discord-akairo](https://discord-akairo.github.io/#/)
-   [Discord.js](https://discord.js.org/#/)

### Music Commands

-   [simple-youtube-api](https://www.npmjs.com/package/simple-youtube-api)
-   [ytd-core](https://www.npmjs.com/package/ytdl-core)

### Services

-   [Repl.it](https://repl.it/)

### Others

-   Other npm packages on [package.json](package.json)

## Credits

Part of the code of the commands on [Commands/Music](./Commands/Music/) are from [galnir/Master-Bot](https://github.com/galnir/Master-Bot). The code is altered so that it uses [Akairo](https://discord-akairo.github.io/#/)
