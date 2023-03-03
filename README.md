# bot.wssp
![Codacy grade][codacy_grade] ![License][license]

A Discord bot that only uses slash commands.

- Written in TypeScript
- Has music commands, with a song history

## Pre-requisites
- Node.js 16.6.0 or higher, with Additional Tools for Node.js
- A Discord bot account
- - Create a Discord bot application [here](https://discord.com/developers/applications) (Instructions [here](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot))
- YouTube Cookies
- - Get your Youtube Cookies using [these instructions](https://github.com/play-dl/play-dl/tree/1ae7ba8fcea8b93293af5de9e19eca3c2a491804/instructions#youtube-cookies)

## Usage
- Clone the repository, or download the zip file [here](https://github.com/ywssp/bot.wssp/archive/refs/heads/main.zip)
- Install the dependencies with `pnpm install`
- Create a file called `.env`, and add [these values](#env-contents)
- Compile the code with `npm run build`
- Setup play-dl by running `npm run setup-play-dl`, and follow the shown instructions
- Run the bot with `npm run start`

## .env contents

### `BOT_TOKEN`

> The token of the bot. Available in the Discord developer portal.

### `BOT_CLIENT_ID`

> The client ID of the bot. Only required to delete the slash command registry

### `OWNER_USER_IDS`

>The user id of the owner(s).
>
>Separate multiple owners with a comma.
>
>It should look like this: `689607114011705439,123456789012345678`
>
> Adding spaces before and after the comma should work too.
>
> To get someones user id, enable developer mode in your Discord settings, and right click on the user. You should see an option called `Copy ID`.

### `CREATE_HTTP_SERVER`

> Useful if you are hosting the bot on an online service that automatically stops the bot after a short period of time, like Replit.
>
> To use this, set the value to `true`.
> Any other value will not create the HTTP server.

Your .env file should look like this:

```env
BOT_TOKEN = NzIwNjA1ODE4MzgyMzE5Njk4.XuIadw.kjtUXvBOzzTxepM_R3y5eW7mBnc
BOT_CLIENT_ID = 720605818382319698
OWNER_USER_IDS = 689607114011705439

# Optional
CREATE_HTTP_SERVER = true
```

[codacy_grade]: https://img.shields.io/codacy/grade/52ab11c35a2e43a9a536568e7d562115?style=flat-square&logo=codacy&logoWidth=12&label=Code+Quality
[license]: https://img.shields.io/github/license/ywssp/bot.wssp?label=License&style=flat-square
