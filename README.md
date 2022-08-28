# bot.wssp
No badges yet ¯\\\_(ツ)_/¯

This is an open-source Discord bot. 

## HUGE Note
This branch is still in development. Most of the music commands are not yet implemented.

Most of the commands here work with slash commands.

Also, the code is now written in TypeScript.

## .env contents

### process.env.TOKEN

The token of the bot

### process.env.OWNER

The user id of the owner/s

### process.env.PREFIX (?)

The prefix that the bot uses. Multiple prefixes are separated using `|`.
Might be removed since slash commands are better.
If they get removed, a version for message commands will be created.

your `.env` file should look like this:

```shell
TOKEN=NzIwNjA1ODE4MzgyMzE5Njk4.XuIadw.kjtUXvBOzzTxepM_R3y5eW7mBnc
OWNER=689607114011705439
PREFIX='+|!|/'
```

## NPM Packages

### Discord

-   [@sapphire/framework](https://discord-akairo.github.io/#/)
-   [Discord.js](https://discord.js.org/#/)

### Others

-   Other npm packages on [package.json](package.json)