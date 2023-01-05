import { Command, ChatInputCommand } from '@sapphire/framework';
import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { MessageEmbed } from 'discord.js';

import type {
  TetrioUserInfoAPIResponse,
  TetrioUserRecordsAPIResponse,
  TetrioUserInfo,
  TetrioUserRecords,
  RecordEndContext
} from '../../interfaces/TetrioAPI';

import {
  getName as getCountryName,
  isValid as isValidCountry
} from 'i18n-iso-countries';
import { Duration } from 'luxon';
import { ColorPalette } from '../../settings/ColorPalette';

export class TetrioCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'tetrio',
      description: 'Displays the info of a TETR.IO user'
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
            .setName('username')
            .setDescription('The username of the TETR.IO user.')
            .setRequired(true)
        )
    );
  }

  public async chatInputRun(interaction: ChatInputCommand.Interaction) {
    const username = interaction.options.getString('username') as string;

    if (username.length < 3) {
      return interaction.reply({
        content: 'Username must be at least 3 characters long!',
        ephemeral: true
      });
    }

    const userInfo = await this.getUserInfo(username);

    return interaction.reply(userInfo);
  }

  private async getUserInfo(
    username: string
  ): Promise<{ content: string } | { embeds: MessageEmbed[] }> {
    // Calling TETR.IO API for user info (Bio, Country, Level, Tetra League)
    let userInfo: TetrioUserInfo['user'];

    try {
      // Check cache
      if (this.container.tetrioUserInfoCache.has(username)) {
        userInfo = (
          this.container.tetrioUserInfoCache.get(username) as TetrioUserInfo
        ).user;
      } else {
        const userInfoRequest = await fetch<TetrioUserInfoAPIResponse>(
          `https://ch.tetr.io/api/users/${username}`,
          FetchResultTypes.JSON
        );

        // API error
        if (!userInfoRequest.success) {
          return {
            content: `An error occurred while fetching the user info.${
              userInfoRequest.error ? '\n' + userInfoRequest.error : ''
            }`
          };
        }

        this.container.tetrioUserInfoCache.set(username, userInfoRequest.data, {
          start: userInfoRequest.cache.cached_at,
          ttl:
            userInfoRequest.cache.cached_until - userInfoRequest.cache.cached_at
        });

        userInfo = userInfoRequest.data.user;
      }
    } catch (error) {
      this.container.logger.error(error);
      return { content: `An error occurred.\n${error}` };
    }

    let specialEmbed;

    switch (userInfo.role) {
      case 'banned':
        specialEmbed = new MessageEmbed()
          .setColor(ColorPalette.error)
          .setTitle(userInfo.username.toUpperCase())
          .setURL(`https://ch.tetr.io/u/${userInfo.username}`)
          .setThumbnail('https://tetr.io/res/avatar-banned.png')
          .setDescription('This user is banned.');
        break;

      case 'bot':
        specialEmbed = new MessageEmbed()
          .setColor('GREY')
          .setTitle(userInfo.username.toUpperCase())
          .setURL(`https://ch.tetr.io/u/${userInfo.username}`)
          .setDescription(
            `This user is a bot.\n${
              userInfo.botmaster ? `Operated by ${userInfo.botmaster}.` : ''
            }`
          );

        if (userInfo.avatar_revision !== undefined) {
          specialEmbed.setThumbnail(
            `https://tetr.io/user-content/avatars/${userInfo._id}.jpg?rv=${userInfo.avatar_revision}`
          );
        }
        break;

      case 'anon':
        specialEmbed = new MessageEmbed()
          .setColor('WHITE')
          .setTitle(userInfo.username.toUpperCase())
          .setURL(`https://ch.tetr.io/u/${userInfo.username}`)
          .setThumbnail('https://tetr.io/res/avatar.png')
          .setDescription(
            'This user is anonymous. Anonymous accounts have no meaningful statistics and cannot save replays.'
          );
        break;

      default:
        break;
    }

    if (specialEmbed) {
      return { embeds: [specialEmbed] };
    }

    // Calling TETR.IO API for user records (Sprint, Blitz, Zen)
    let userRecords: TetrioUserRecords;

    try {
      // Check cache
      if (this.container.tetrioUserRecordCache.has(username)) {
        userRecords = this.container.tetrioUserRecordCache.get(
          username
        ) as TetrioUserRecords;
      } else {
        const userRecordsRequest = await fetch<TetrioUserRecordsAPIResponse>(
          `https://ch.tetr.io/api/users/${username}/records`,
          FetchResultTypes.JSON
        );

        // API error
        if (!userRecordsRequest.success) {
          return {
            content: `An error occurred while fetching the user records.${
              userRecordsRequest.error ? '\n' + userRecordsRequest.error : ''
            }`
          };
        }

        this.container.tetrioUserRecordCache.set(
          username,
          userRecordsRequest.data,
          {
            start: userRecordsRequest.cache.cached_at,
            ttl:
              userRecordsRequest.cache.cached_until -
              userRecordsRequest.cache.cached_at
          }
        );

        userRecords = userRecordsRequest.data;
      }
    } catch (error) {
      this.container.logger.error(error);
      return { content: `An error occurred.\n${error}` };
    }

    // Create embed
    const embed = new MessageEmbed()
      .setColor(ColorPalette.default)
      .setTitle(userInfo.username.toUpperCase())
      .setURL(`https://ch.tetr.io/u/${userInfo.username}`);

    if (typeof userInfo.avatar_revision !== undefined) {
      embed.setThumbnail(
        `https://tetr.io/user-content/avatars/${userInfo._id}.jpg?rv=${userInfo.avatar_revision}`
      );
    }

    // Basic Data
    let description = '';

    if (userInfo.bio !== undefined) {
      description += userInfo.bio + '\n\n';
    }

    if (
      typeof userInfo.country !== 'undefined' &&
      isValidCountry(userInfo.country)
    ) {
      description += `Country: ${getCountryName(userInfo.country, 'en')}`;
    }

    description += `\nLevel: ${Math.floor(
      Math.pow(userInfo.xp / 500, 0.6) +
        userInfo.xp / (5000 + Math.max(0, userInfo.xp - 4000000) / 5000) +
        1
    )} (${userInfo.xp.toLocaleString()} XP)`;

    description += '\nPublic Games: ';
    switch (userInfo.gamesplayed) {
      case -1:
        description += 'Data Hidden';
        break;
      case 0:
        description += 'Never Played';
        break;

      default:
        description +=
          userInfo.gameswon.toLocaleString() +
          ' W | ' +
          userInfo.gamesplayed.toLocaleString() +
          ' T [' +
          +((userInfo.gameswon / userInfo.gamesplayed) * 100).toFixed(2) +
          '%]';
        break;
    }

    embed.setDescription(description);

    // Tetra League Data
    const leagueData = userInfo.league;
    let leagueDescription: string;

    if (leagueData.gamesplayed <= 0) {
      leagueDescription = 'Never Played';
    } else {
      leagueDescription =
        'Games: ' +
        leagueData.gameswon.toLocaleString() +
        ' W | ' +
        leagueData.gamesplayed.toLocaleString() +
        ' T [' +
        ((leagueData.gameswon / leagueData.gamesplayed) * 100).toFixed(2) +
        '%]';

      let leagueRank = '';

      if (leagueData.rank !== 'z') {
        leagueRank = leagueData.rank.toUpperCase();
        const progressRange = leagueData.next_at - leagueData.prev_at;
        const relativeRank = leagueData.standing - leagueData.next_at;

        const progress = Math.floor((relativeRank / progressRange + 1) * 100);

        if (leagueData.rank !== 'x' && leagueData.next_rank !== null) {
          leagueRank +=
            ' (' +
            progress +
            '% towards ' +
            leagueData.next_rank.toUpperCase() +
            ')';
        }
      } else if (leagueData.percentile_rank !== 'z') {
        leagueRank += `Unranked (Around ${leagueData.percentile_rank.toUpperCase()})`;
      } else {
        leagueRank += 'Unranked';
      }

      leagueDescription += '\nRank: ' + leagueRank;

      leagueDescription += `\nBest Rank: ${leagueData.bestrank.toUpperCase()}`;

      if (
        leagueData.rating > -1 &&
        typeof leagueData.glicko !== 'undefined' &&
        typeof leagueData.rd !== 'undefined'
      ) {
        leagueDescription += `\nRating: ${Math.floor(
          leagueData.rating
        )} TR (Glicko: ${Math.round(leagueData.glicko)}±${Math.round(
          leagueData.rd
        )})`;
      } else {
        leagueDescription += 'Rating: Not yet defined';
      }

      if (leagueData.standing !== -1) {
        leagueDescription += `\nRanking: [No. ${leagueData.standing.toLocaleString()}](https://ch.tetr.io/players/#${
          leagueData.rating
        }:${leagueData.standing})`;

        if (leagueData.standing_local !== -1) {
          leagueDescription += ` | [No. ${leagueData.standing_local.toLocaleString()}](https://ch.tetr.io/players/#${
            leagueData.rating
          }:${leagueData.standing_local}:${
            userInfo.country
          }) on Local Leaderboards`;
        }
      } else {
        leagueDescription += '\nRanking: Not on Leaderboards';
      }
    }

    embed.addFields({ name: 'TETRA LEAGUE', value: leagueDescription });

    // Single Player Data

    // Blitz
    const blitzData = userRecords.records.blitz;
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
      blitzDescription += 'No Record';
    }

    // Sprint/40 Lines
    const sprintData = userRecords.records['40l'];
    let sprintDescription = '';

    if (sprintData.record !== null) {
      const endcontext = sprintData.record.endcontext as RecordEndContext;

      const recordDuration = Duration.fromMillis(
        Math.floor(endcontext.finalTime)
      );

      sprintDescription = `[${recordDuration.toFormat(
        'm:ss:SSS'
      )}](https://tetr.io/#r:${sprintData.record.replayid})`;

      if (sprintData.rank !== null) {
        sprintDescription += '\nNo. ' + sprintData.rank.toLocaleString();
      } else {
        sprintDescription += '\nNot on leaderboards';
      }
    } else {
      sprintDescription += 'No Record';
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
          userRecords.zen.level
        }\nScore: ${userRecords.zen.score.toLocaleString()}`
      }
    ]);

    return { embeds: [embed] };
  }
}
