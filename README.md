# bot.wssp
![Codacy grade][codacy_grade] ![License][license]

A Discord bot that only uses slash commands.

- Written in TypeScript
- Has music commands with a queue/history system
- Supports YouTube, SoundCloud, Spotify, and LISTEN.moe

## Pre-requisites
- [Node.js 22](https://nodejs.org/en) or higher, with Additional Tools
- A Discord bot account ([Guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot-application))
- YouTube Cookies ([Guide](https://github.com/play-dl/play-dl/tree/6a8569feb8c562bb8218ecfd72850c3686d96256/instructions#youtube-cookies))
- A Spotify Application ([Guide](https://github.com/play-dl/play-dl/tree/6a8569feb8c562bb8218ecfd72850c3686d96256/instructions#spotify))

## Usage
- Clone the repository, or download the zip file [here](https://github.com/ywssp/bot.wssp/archive/refs/heads/main.zip)
- Install the dependencies by running `npm install` in the terminal
- Create a file named `.env`, and [add these values](#required-env-contents)
- Compile the source code with `npm run build`
- Setup play-dl by running `npm run setup-play-dl`, and add the YouTube cookies and Spotify application details
- Run the bot with `npm run start`

## Required ENV fields
### Example `.env` file

```env\
BOT_TOKEN = NzIwNjA1ODE4MzgyMzE5Njk4.XuIadw.kjtUXvBOzzTxepM_R3y5eW7mBnc
BOT_CLIENT_ID = 720605818382319698
OWNER_USER_IDS = 689607114011705439
```

### `BOT_TOKEN`

The token of the bot. Required to login to Discord.

Available in the [Discord developer portal](https://discord.com/developers/applications).

### `BOT_CLIENT_ID`

The client ID of the bot. Used to modify the slash commands of the bot.

Also available in the [Discord developer portal](https://discord.com/developers/applications).

### `OWNER_USER_IDS`

The user id of the bot owner(s). Multiple user ids should be separated by a `,`.

To get a Discord user's id, enable Developer Mode (Settings > Advanced) in your Discord settings, and right click on the user. You should see an option called `Copy ID`.

The field should look like `689607114011705439,123456789012345678`


## Optional ENV fields
These values are optional, and can be added to the `.env` file.

```env
CREATE_HTTP_SERVER = true
DEBUG = true
```

### `CREATE_HTTP_SERVER`

Useful if you are hosting the bot on an online service that automatically stops the bot after a short period of time, like Replit.

Set the field to `true` to enable.

### `DEBUG`
Logs debug information to the console. Set the field to `true` to enable.

[codacy_grade]: https://img.shields.io/codacy/grade/52ab11c35a2e43a9a536568e7d562115?style=flat-square&logo=codacy&logoWidth=12&label=Code+Quality
[license]: https://img.shields.io/github/license/ywssp/bot.wssp?label=License&style=flat-square
