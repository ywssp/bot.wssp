# Bot.wssp
![Codacy grade][codacy_grade] ![Depfu][dependencies] ![License][license]

This is an open-source Discord bot. 

## UPDATE
Discord.js v13 just came out. Don't copy code from this repo if your bot isn't using discord.js v12.
I am learning TypeScript so i can revise the code for v13.

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

[codacy_grade]: https://img.shields.io/codacy/grade/3a8ad92e804c437f83d7f858c2a26662/stable?style=flat-square
[license]: https://img.shields.io/github/license/ywssp/bot.wssp?style=flat-square
[dependencies]: https://img.shields.io/depfu/ywssp/bot.wssp?style=flat-square
