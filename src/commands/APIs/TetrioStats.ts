import { Command, ChatInputCommand } from '@sapphire/framework';
import { fetch, FetchResultTypes } from '@sapphire/fetch';
import {
  codeBlock,
  EmbedBuilder,
  hyperlink,
  inlineCode,
  InteractionReplyOptions
} from 'discord.js';

import type {
  TetrioUserInfoAPIResponse,
  TetrioUserRecordsAPIResponse,
  TetrioUserInfo,
  TetrioUserRecords,
  RecordEndContext
} from '../../interfaces/APIs/TetrioAPI';

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
            .setMinLength(3)
            .setRequired(true)
        )
    );
  }

  public async chatInputRun(interaction: ChatInputCommand.Interaction) {
    const username = interaction.options.getString('username') as string;

    const userInfo = await this.generateEmbed(username);

    return interaction.reply(userInfo);
  }

  private async generateEmbed(
    username: string
  ): Promise<InteractionReplyOptions> {
    // Calling TETR.IO API for user info (Bio, Country, Level, Tetra League)
    let userInfo: TetrioUserInfo['user'];

    try {
      userInfo = await this.getUserInfo(username);
    } catch (error) {
      this.container.logger.error(error);

      let errorMessage = '';

      if (error instanceof Error) {
        errorMessage = codeBlock(error.message);
      }

      return {
        content: `An error occurred while fetching the user info of ${inlineCode(
          username.toUpperCase()
        )}${errorMessage ? '\n' + errorMessage : ''}`
      };
    }

    // Check if the user is special (Bot, Banned, Anonymous)
    const specialUserEmbed = this.handleSpecialUser(userInfo);

    if (specialUserEmbed !== null) {
      return specialUserEmbed;
    }

    // Calling TETR.IO API for user records (Sprint, Blitz, Zen)
    let userRecords: TetrioUserRecords;

    try {
      userRecords = await this.getUserRecords(username);
    } catch (error) {
      this.container.logger.error(error);

      let errorMessage = '';

      if (error instanceof Error) {
        errorMessage = codeBlock(error.message);
      }

      return {
        content: `An error occurred while fetching the user records of ${inlineCode(
          username.toUpperCase()
        )}${errorMessage ? '\n' + errorMessage : ''}`
      };
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(ColorPalette.Default)
      .setTitle(userInfo.username.toUpperCase())
      .setURL(`https://ch.tetr.io/u/${userInfo.username}`)
      .setDescription(this.getBasicInfoString(userInfo))
      .addFields([
        {
          name: 'TETRA LEAGUE',
          value: this.getTetraLeagueInfoString(userInfo)
        },
        {
          name: 'BLITZ',
          value: this.getBlitzInfoString(userRecords)
        },
        {
          name: '40 LINES',
          value: this.getSprintInfoString(userRecords)
        },
        {
          name: 'ZEN',
          value: this.getZenInfoString(userRecords)
        }
      ]);

    // Set avatar if available
    const userAvatarURL = this.getUserAvatarURL(userInfo);
    if (userAvatarURL !== undefined) {
      embed.setThumbnail(userAvatarURL);
    }

    return { embeds: [embed] };
  }

  private async getUserInfo(username: string): Promise<TetrioUserInfo['user']> {
    let userInfo: TetrioUserInfo['user'] | null = null;

    // Check cache
    if (this.container.caches.tetrioUserInfos.has(username)) {
      userInfo = (
        this.container.caches.tetrioUserInfos.get(username) as TetrioUserInfo
      ).user;
    } else {
      const userInfoRequest = await fetch<TetrioUserInfoAPIResponse>(
        `https://ch.tetr.io/api/users/${username}`,
        FetchResultTypes.JSON
      );

      // API error
      if (!userInfoRequest.success) {
        throw new Error(
          `${userInfoRequest.error ? userInfoRequest.error : ''}`
        );
      }

      this.container.caches.tetrioUserInfos.set(
        username,
        userInfoRequest.data,
        {
          start: userInfoRequest.cache.cached_at,
          ttl:
            userInfoRequest.cache.cached_until - userInfoRequest.cache.cached_at
        }
      );

      userInfo = userInfoRequest.data.user;
    }

    return userInfo;
  }

  private async getUserRecords(username: string): Promise<TetrioUserRecords> {
    let userRecords: TetrioUserRecords | null = null;

    // Check cache
    if (this.container.caches.tetrioUserRecords.has(username)) {
      userRecords = this.container.caches.tetrioUserRecords.get(
        username
      ) as TetrioUserRecords;
    } else {
      const userRecordsRequest = await fetch<TetrioUserRecordsAPIResponse>(
        `https://ch.tetr.io/api/users/${username}/records`,
        FetchResultTypes.JSON
      );

      // API error
      if (!userRecordsRequest.success) {
        throw new Error(`
          ${userRecordsRequest.error ? '\n' + userRecordsRequest.error : ''}`);
      }

      this.container.caches.tetrioUserRecords.set(
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

    return userRecords;
  }

  private getUserAvatarURL(
    userInfo: TetrioUserInfo['user']
  ): string | undefined {
    if (userInfo.avatar_revision !== undefined) {
      return `https://tetr.io/user-content/avatars/${userInfo._id}.jpg?rv=${userInfo.avatar_revision}`;
    }

    return undefined;
  }

  private handleSpecialUser(
    userInfo: TetrioUserInfo['user']
  ): InteractionReplyOptions | null {
    let embed;

    if (userInfo.role === 'banned') {
      embed = new EmbedBuilder()
        .setColor(ColorPalette.Error)
        .setTitle(userInfo.username.toUpperCase())
        .setURL(`https://ch.tetr.io/u/${userInfo.username}`)
        .setThumbnail('https://tetr.io/res/avatar-banned.png')
        .setDescription('This user is banned.');
    } else if (userInfo.role === 'bot') {
      embed = new EmbedBuilder()
        .setColor('Grey')
        .setTitle(userInfo.username.toUpperCase())
        .setURL(`https://ch.tetr.io/u/${userInfo.username}`)
        .setDescription(
          `This user is a bot.\n${
            userInfo.botmaster ? `Operated by ${userInfo.botmaster}.` : ''
          }`
        );

      const userAvatarURL = this.getUserAvatarURL(userInfo);
      if (userAvatarURL !== undefined) {
        embed.setThumbnail(userAvatarURL);
      }
    } else if (userInfo.role === 'anon') {
      embed = new EmbedBuilder()
        .setColor('White')
        .setTitle(userInfo.username.toUpperCase())
        .setURL(`https://ch.tetr.io/u/${userInfo.username}`)
        .setThumbnail('https://tetr.io/res/avatar.png')
        .setDescription(
          'This user is anonymous. Anonymous accounts have no meaningful statistics and cannot save replays.'
        );
    }

    if (embed === undefined) {
      return null;
    }

    return { embeds: [embed] };
  }

  private getBasicInfoString(userInfo: TetrioUserInfo['user']): string {
    /*
      Format Example:
      * Bio (if exists)

      * Country: Country Name (If exists)
      * Level: 0 (0 XP)
      * Public Games: 0 W | 0 T [0%]
    */

    let string = '';

    if (userInfo.bio !== undefined) {
      string += userInfo.bio.trim() + '\n\n';
    }

    if (userInfo.country !== undefined && isValidCountry(userInfo.country)) {
      string += `Country: ${getCountryName(userInfo.country, 'en')}`;
    }

    const xp = userInfo.xp;
    const userLevel = Math.floor(
      Math.pow(xp / 500, 0.6) +
        xp / (5000 + Math.max(0, xp - 4000000) / 5000) +
        1
    );

    string += `\nLevel: ${userLevel} (${xp.toLocaleString()} XP)`;

    const gamesPlayed = userInfo.gamesplayed;
    let gamesPlayedString = '';

    if (gamesPlayed === -1) {
      gamesPlayedString = 'Data Hidden';
    } else if (gamesPlayed === 0) {
      gamesPlayedString = 'Never Played';
    } else if (gamesPlayed > 0) {
      const wins = userInfo.gameswon.toLocaleString();
      const totalGames = gamesPlayed.toLocaleString();
      const winPercentage =
        ((userInfo.gameswon / gamesPlayed) * 100).toFixed(2) + '%';

      gamesPlayedString = `${wins} W | ${totalGames} T [${winPercentage}]`;
    }

    string += `\nPublic Games: ${gamesPlayedString}`;

    return string;
  }

  private getTetraLeagueInfoString(userInfo: TetrioUserInfo['user']): string {
    /*
      Format Example:
      * Rank: Unranked (Around S Rank, Not enough games / RD too high) [if unranked] SS (7% towards U) [if ranked]
      * Best Rank: S-
      * Games: 54 W | 102 T [52.94%]
      * Rating: 19052 TR (Glicko: 1810±113)
      * Ranking: Not on Leaderboards
     */
    const leagueData = userInfo.league;
    let string = '';

    if (leagueData.gamesplayed <= 0) {
      return 'Never Played';
    }

    let leagueRank = '';

    if (leagueData.rank !== 'z') {
      leagueRank = leagueData.rank.toUpperCase();
      const progressRange = leagueData.next_at - leagueData.prev_at;
      const relativeRank = leagueData.standing - leagueData.next_at;

      const progress = Math.floor((relativeRank / progressRange + 1) * 100);

      if (leagueData.rank !== 'x' && leagueData.next_rank !== null) {
        const nextRank = leagueData.next_rank.toUpperCase();
        leagueRank += ` (${progress}% to ${nextRank})`;
      }
    } else if (leagueData.percentile_rank !== 'z') {
      leagueRank = `Unranked (Around ${leagueData.percentile_rank.toUpperCase()} Rank, Rating Deviation too high)`;
    } else {
      leagueRank = 'Unranked (Not enough games played)';
    }

    const rankString = 'Rank: ' + leagueRank;

    const bestRankString = `Best Rank: ${leagueData.bestrank.toUpperCase()}`;

    const wins = leagueData.gameswon.toLocaleString();
    const totalGames = leagueData.gamesplayed.toLocaleString();
    const winPercentage =
      ((leagueData.gameswon / leagueData.gamesplayed) * 100).toFixed(2) + '%';

    const gameDataString = `Games: ${wins} W | ${totalGames} T [${winPercentage}]`;

    let ratingString = '';
    if (
      leagueData.rating > -1 &&
      leagueData.glicko !== undefined &&
      leagueData.rd !== undefined
    ) {
      const tr = Math.floor(leagueData.rating);
      const glicko = Math.round(leagueData.glicko);
      const rd = Math.round(leagueData.rd);

      ratingString = `Rating: ${tr} TR (Glicko: ${glicko}±${rd})`;
    } else {
      ratingString = 'Rating: Not yet defined';
    }

    let leaderboardString = '';
    if (leagueData.standing !== -1) {
      const globalStanding = leagueData.standing.toLocaleString();
      const globalLeaderboardPlacement =
        leagueData.rating + ':' + leagueData.standing;

      leaderboardString = `Ranking: ${hyperlink(
        `No. ${globalStanding}`,
        `https://ch.tetr.io/players/#${globalLeaderboardPlacement}`
      )}`;

      if (leagueData.standing_local !== -1) {
        const localStanding = leagueData.standing_local.toLocaleString();
        const localLeaderboardPlacement = `${leagueData.rating}:${leagueData.standing_local}:${userInfo.country}`;

        leaderboardString += ` | ${hyperlink(
          `No. ${localStanding}`,
          `https://ch.tetr.io/players/#${localLeaderboardPlacement}`
        )} on Local Leaderboards`;
      }
    } else {
      leaderboardString = 'Ranking: Not on Leaderboards';
    }

    string =
      rankString +
      '\n' +
      bestRankString +
      '\n' +
      gameDataString +
      '\n' +
      ratingString +
      '\n' +
      leaderboardString;

    return string;
  }

  private getBlitzInfoString(userRecords: TetrioUserRecords): string {
    /*
      Format Example:
      * 731,803
      * No. 367 / Not on Leaderboards
    */
    const blitzData = userRecords.records.blitz;
    let string = '';

    if (blitzData.record === null) {
      return 'Never Played';
    }

    const endcontext = blitzData.record.endcontext as RecordEndContext;

    const scoreString = hyperlink(
      endcontext.score.toLocaleString(),
      `https://tetr.io/#r:${blitzData.record.replayid}`
    );

    let placeString = '';
    if (blitzData.rank === null) {
      placeString = '\nNot on leaderboards';
    } else {
      placeString = '\nNo. ' + blitzData.rank.toLocaleString();
    }

    string += scoreString + placeString;

    return string;
  }

  private getSprintInfoString(userRecords: TetrioUserRecords): string {
    /*
      Format Example:
      * 0:18.168
      * No. 38 / Not on Leaderboards
    */
    const sprintData = userRecords.records['40l'];
    let string = '';

    if (sprintData.record === null) {
      return 'Never Played';
    }

    const endcontext = sprintData.record.endcontext as RecordEndContext;

    const recordDuration = Duration.fromMillis(
      Math.floor(endcontext.finalTime)
    );

    const timeString = hyperlink(
      recordDuration.toFormat('m:ss.SSS'),
      `https://tetr.io/#r:${sprintData.record.replayid}`
    );

    let placeString = '';
    if (sprintData.rank === null) {
      placeString = 'Not on leaderboards';
    } else {
      placeString += 'No. ' + sprintData.rank.toLocaleString();
    }

    string = timeString + '\n' + placeString;

    return string;
  }

  private getZenInfoString(userRecords: TetrioUserRecords): string {
    /*
      Format Example:
      * Level 108
      * Score: 6,531,596
    */
    const zenData = userRecords.zen;

    const levelString = 'Level ' + zenData.level.toLocaleString();
    const scoreString = 'Score: ' + zenData.score.toLocaleString();

    const string = levelString + '\n' + scoreString;

    return string;
  }
}
