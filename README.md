# bot.wssp
![Codacy grade][codacy_grade] ![License][license]

A Discord bot that uses slash commands.

- Written in TypeScript
- Has music commands, with a song history
- No API keys required (Except for the discord bot token)

## Pre-requisites
- Node.js 16.6.0 or higher, with Additional Tools for Node.js
- A Discord bot account 
- - Create a Discord bot application [here](https://discord.com/developers/applications) (Instructions [here](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot))

## Usage
- Clone the repository, or download the zip file [here](https://github.com/ywssp/bot.wssp/archive/refs/heads/v13-sapphire.zip)
- Install the dependencies with `npm install`
- Create a file called `.env`, and add [these values](#env-contents)
- Compile the code with `npm run build`
- Run the bot with `npm run start`

## .env contents

### TOKEN

The token of the bot. Available in the Discord developer portal.

### CLIENT_ID

The client ID of the bot. Only required to delete the slash command registry

### OWNER

The user id of the owner(s). Separate multiple owners with a comma.

Get the user id by enabling developer mode in Discord, and right clicking on the user.

### PREFIX (?)

The prefix that the bot uses. Only used by commands that can run without slash commands.

Here is an example of a .env file:

```env
TOKEN = NzIwNjA1ODE4MzgyMzE5Njk4.XuIadw.kjtUXvBOzzTxepM_R3y5eW7mBnc
CLIENT_ID = 720605818382319698
OWNER = 689607114011705439
PREFIX = '+|!|/'
```

## NPM Packages

### Discord

-   [@sapphire/framework](https://www.sapphirejs.dev/)
-   [Discord.js](https://discord.js.org/#/)

### Others

-   Other npm packages on [package.json](package.json)

[codacy_grade]: https://img.shields.io/codacy/grade/52ab11c35a2e43a9a536568e7d562115?style=flat-square
[license]: https://img.shields.io/github/license/ywssp/bot.wssp?style=flat-square