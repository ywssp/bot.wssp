# bot.wssp
![Codacy grade][codacy_grade] ![Depfu][dependencies] ![License][license]

This is an open-source Discord bot. 

## Note
4.0 might be be the last major update that uses Discord.js v12.
I will now try to use v13 for future versions.
This branch will still be updated for bug fixes.

## .env contents

### process.env.TOKEN

The token of the bot

### process.env.OWNER

The user id of the owner/s

### process.env.PREFIX

The prefix that the bot uses. Multiple prefixes are separated using `|`

your `.env` file should look like this:

```shell
TOKEN=NzIwNjA1ODE4MzgyMzE5Njk4.XuIadw.kjtUXvBOzzTxepM_R3y5eW7mBnc
OWNER=689607114011705439
PREFIX='+|!|/'
```

## NPM Packages

### Discord

-   [discord-akairo](https://discord-akairo.github.io/#/)
-   [Discord.js](https://discord.js.org/#/)

### Music Commands

-   [ytdl-core](https://www.npmjs.com/package/ytdl-core)
-   [ytpl](https://www.npmjs.com/package/ytpl)
-   [ytsr](https://www.npmjs.com/package/ytsr)

### Others

-   Other npm packages on [package.json](package.json)

[codacy_grade]: https://img.shields.io/codacy/grade/52ab11c35a2e43a9a536568e7d562115?style=flat-square
[license]: https://img.shields.io/github/license/ywssp/bot.wssp?style=flat-square
[dependencies]: https://img.shields.io/depfu/ywssp/bot.wssp?style=flat-square
