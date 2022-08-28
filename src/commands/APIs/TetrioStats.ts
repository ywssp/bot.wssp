import { Command, Args, ChatInputCommand } from '@sapphire/framework';
import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { Message, MessageEmbed } from 'discord.js';

import type {
  RecordEndContext,
  TetrioUserInfo,
  TetrioUserRecords
} from '../../interfaces/TetrioAPI';

import {
  getName as getCountryName,
  isValid as isValidCountry
} from 'i18n-iso-countries';
import { Duration } from 'luxon';

export class TetrioCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'tetrio',
      aliases: [],
      description: 'Shows the stats of a TETR.IO user.'
    });
  }

  public override registerApplicationCommands(
    registry: ChatInputCommand.Registry
  ) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName('user')
            .setDescription('The name of the TETR.IO user to check.')
            .setRequired(true)
        )
    );
  }

  public async messageRun(message: Message, args: Args) {
    // Argument Processing
    const username = (await args.pick('string')).toLowerCase();

    if (username.length < 0) {
      return message.channel.send('No username provided!');
    }

    const userData = await this.getUserData(username);

    if (typeof userData === 'string') {
      return message.channel.send(userData);
    }

    return message.channel.send({ embeds: [userData] });
  }

  public async chatInputRun(interaction: ChatInputCommand.Interaction) {
    const username = interaction.options.getString('user');

    if (username === null || username.length < 0) {
      return interaction.reply('No username provided!');
    }

    const userData = await this.getUserData(username);

    if (typeof userData === 'string') {
      return interaction.reply(userData);
    }

    return interaction.reply({ embeds: [userData] });
  }

  private async getUserData(username: string) {
    // Calling TETR.IO API for user info (Bio, Country, Level, Tetra League)
    let userInfo: TetrioUserInfo;

    try {
      userInfo = await fetch<TetrioUserInfo>(
        `https://ch.tetr.io/api/users/${username}`,
        FetchResultTypes.JSON
      );
    } catch (error) {
      console.error(error);
      return `An error occurred.${error}`;
    }

    // API error
    if (!userInfo.success) {
      return `An error occurred while fetching the user info.${
        userInfo.error ? '\n' + userInfo.error : ''
      }`;
    }

    // Easier to use variable
    const userData = userInfo.data.user;

    // Special cases for some user roles
    if (userData.role === 'bot') {
      const embed = new MessageEmbed()
        .setColor('#4e342e')
        .setTitle(userData.username.toUpperCase())
        .setURL(`https://ch.tetr.io/u/${userData.username}`)
        .setDescription(
          `This user is a bot.\n${
            userData.botmaster ? `Operated by ${userData.botmaster}.` : ''
          }`
        );

      if (typeof userData.avatar_revision !== 'undefined') {
        embed.setThumbnail(
          `https://tetr.io/user-content/avatars/${userData._id}.jpg?rv=${userData.avatar_revision}`
        );
      }

      return embed;
    }

    if (userData.role === 'banned') {
      const embed = new MessageEmbed()
        .setColor('#ff6f00')
        .setTitle(userData.username.toUpperCase())
        .setURL(`https://ch.tetr.io/u/${userData.username}`)
        .setThumbnail('https://tetr.io/res/avatar-banned.png')
        .setDescription('This user is banned.');

      return embed;
    }

    if (userData.role === 'anon') {
      const embed = new MessageEmbed()
        .setColor('#b0bec5')
        .setTitle(userData.username.toUpperCase())
        .setURL(`https://ch.tetr.io/u/${userData.username}`)
        .setThumbnail('https://tetr.io/res/avatar.png')
        .setDescription(
          'This user is anonymous. Anonymous accounts have no meaningful statistics and cannot save replays.'
        );

      return embed;
    }

    // Calling TETR.IO API for user records (Sprint, Blitz, Zen)
    let userRecords: TetrioUserRecords;

    try {
      userRecords = await fetch<TetrioUserRecords>(
        `https://ch.tetr.io/api/users/${username}/records`,
        FetchResultTypes.JSON
      );
    } catch (error) {
      console.error(error);
      return `An error occurred.${error}`;
    }

    // API error
    if (!userRecords.success) {
      return `An error occurred while fetching the user records.${
        userRecords.error ? '\n' + userRecords.error : ''
      }`;
    }

    // Create embed
    const embed = new MessageEmbed()
      .setColor('#1de9b6')
      .setTitle(userData.username.toUpperCase())
      .setURL(`https://ch.tetr.io/u/${userData.username}`);

    if (typeof userData.avatar_revision !== undefined) {
      embed.setThumbnail(
        `https://tetr.io/user-content/avatars/${userData._id}.jpg?rv=${userData.avatar_revision}`
      );
    }

    // Basic Data
    let description = '';

    if (typeof userData.bio !== 'undefined') {
      description += userData.bio + '\n\n';
    }

    if (typeof userData.country !== 'undefined') {
      if (isValidCountry(userData.country)) {
        description += `Country: ${getCountryName(userData.country, 'en')}`;
      }
    }

    description +=
      '\nLevel: ' +
      Math.floor(
        Math.pow(userData.xp / 500, 0.6) +
          userData.xp / (5000 + Math.max(0, userData.xp - 4000000) / 5000) +
          1
      );

    description += '\nPublic Games: ';
    switch (userData.gamesplayed) {
      case -1:
        description += 'Data Hidden';
        break;
      case 0:
        description += 'Never Played';
        break;

      default:
        description +=
          userData.gameswon.toLocaleString() +
          ' W | ' +
          userData.gamesplayed.toLocaleString() +
          ' T [' +
          +((userData.gameswon / userData.gamesplayed) * 100).toFixed(2) +
          '%]';
        break;
    }

    embed.setDescription(description);

    // Tetra League Data
    const userLeague = userData.league;
    let leagueDescription: string;

    if (userLeague.gamesplayed > 0) {
      leagueDescription =
        'Games: ' +
        userLeague.gameswon.toLocaleString() +
        ' W | ' +
        userLeague.gamesplayed.toLocaleString() +
        ' T [' +
        +((userLeague.gameswon / userLeague.gamesplayed) * 100).toFixed(2) +
        '%]';

      let leagueRank = '';

      if (userLeague.rank !== 'z') {
        leagueRank = userLeague.rank.toUpperCase();
        const progressRange = userLeague.next_at - userLeague.prev_at;
        const relativeRank = userLeague.standing - userLeague.next_at;

        const progress = Math.floor((relativeRank / progressRange + 1) * 100);

        if (userLeague.rank !== 'x' && userLeague.next_rank !== null) {
          leagueRank +=
            ' (' +
            progress +
            '% towards ' +
            userLeague.next_rank.toUpperCase() +
            ')';
        }
      } else if (userLeague.percentile_rank !== 'z') {
        leagueRank += `Unranked (Probably around ${userLeague.percentile_rank.toUpperCase()})`;
      } else {
        leagueRank += 'Unranked';
      }

      leagueDescription += '\nRank: ' + leagueRank;

      if (
        userLeague.rating > -1 &&
        typeof userLeague.glicko !== 'undefined' &&
        typeof userLeague.rd !== 'undefined'
      ) {
        leagueDescription += `\nRating: ${Math.floor(
          userLeague.rating
        )} TR (Glicko: ${Math.round(userLeague.glicko)}±${Math.round(
          userLeague.rd
        )})`;
      } else {
        leagueDescription += 'Rating: Not yet defined';
      }

      if (userLeague.standing !== -1) {
        leagueDescription += `\nRanking: [No. ${userLeague.standing.toLocaleString()}](https://ch.tetr.io/players/#${
          userLeague.rating
        }:${userLeague.standing})`;

        if (userLeague.standing_local !== -1) {
          leagueDescription += ` | [No. ${userLeague.standing_local.toLocaleString()}](https://ch.tetr.io/players/#${
            userLeague.rating
          }:${userLeague.standing_local}:${
            userData.country
          }) on Local Leaderboards`;
        }
      } else {
        leagueDescription += '\nRanking: Not on Leaderboards';
      }
    } else {
      leagueDescription = 'Never Played';
    }

    embed.addField('TETRA LEAGUE', leagueDescription);
    // Single Player Data
    // Blitz
    const blitzData = userRecords.data.records.blitz;
    let blitzDescription = '';

    if (blitzData.record !== null) {
      const endcontext = blitzData.record.endcontext as RecordEndContext;

      blitzDescription = `[${endcontext.score.toLocaleString()}](https://tetr.io/#r:${
        blitzData.record.replayid
      })`;

      if (blitzData.rank !== null) {
        blitzDescription += '\nNo. ' + blitzData.rank.toLocaleString();
      } else {
        blitzDescription += '\nNot on leaderboards';
      }
    } else {
      blitzDescription += 'No Records';
    }

    // Sprint/40 Lines
    const sprintData = userRecords.data.records['40l'];
    let sprintDescription = '';

    if (sprintData.record !== null) {
      const endcontext = sprintData.record.endcontext as RecordEndContext;

      const recordDuration = Duration.fromMillis(
        Math.floor(endcontext.finalTime)
      );

      sprintDescription = `[${recordDuration.toFormat(
        'm:s:SSS'
      )}](https://tetr.io/#r:${sprintData.record.replayid})`;

      if (sprintData.rank !== null) {
        sprintDescription += '\nNo. ' + sprintData.rank.toLocaleString();
      } else {
        sprintDescription += '\nNot on leaderboards';
      }
    } else {
      sprintDescription += 'No Records';
    }

    embed.addFields([
      {
        name: 'BLITZ',
        value: blitzDescription
      },
      {
        name: '40 LINES',
        value: sprintDescription
      },
      {
        name: 'ZEN',
        value: `Level ${
          userRecords.data.zen.level
        }\nScore: ${userRecords.data.zen.score.toLocaleString()}`
      }
    ]);

    return embed;
  }
}
