import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder, GuildMember } from 'discord.js';
import * as playdl from 'play-dl';
import { createGuildMusicData } from '../../../functions/music-utilities/guildMusicDataManager';
import {
  QueuedTrackInfo,
  TrackInfo
} from '../../../interfaces/Music/Queue System/TrackInfo';
import { TrackCacheResult } from '../../../interfaces/Music/Queue System/TrackCacheResult';
import { createFancyEmbedFromTrack } from '../../../functions/music-utilities/queue-system/createFancyEmbedFromTrack';
import { startQueuePlayback } from '../../../functions/music-utilities/queue-system/startQueuePlayback';

import { ColorPalette } from '../../../settings/ColorPalette';
import { getTrackNamings } from '../../../functions/music-utilities/queue-system/getTrackNamings';
import { searchYoutube } from '../../../functions/music-utilities/queue-system/searchers/youtube';
import { searchSoundCloud } from '../../../functions/music-utilities/queue-system/searchers/soundcloud';
import {
  SoundCloudTrackNaming,
  YTMusicTrackNaming,
  YouTubeVideoNaming
} from '../../../settings/TrackNaming';
import { searchYTMusic } from '../../../functions/music-utilities/queue-system/searchers/youtubeMusic';

export class PlayMusicCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'play',
      description: 'Plays a track from YouTube, YouTube Music, or SoundCloud',
      runIn: ['GUILD_TEXT'],
      preconditions: ['InVoiceChannel']
    });
  }

  public override registerApplicationCommands(
    registry: ChatInputCommand.Registry
  ) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((subcommand) =>
          subcommand
            .setName('youtube')
            .setDescription('Plays a video from YouTube')
            .addStringOption((option) =>
              option
                .setName('link-or-query')
                .setDescription(
                  'The link of the video, or the query to use for searching'
                )
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('soundcloud')
            .setDescription('Plays a track from SoundCloud')
            .addStringOption((option) =>
              option
                .setName('link-or-query')
                .setDescription(
                  'The link of the track, or the query to use for searching'
                )
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('yt_music')
            .setDescription(
              'Plays a track based from a YouTube video, of by searching'
            )
            .addStringOption((option) =>
              option
                .setName('link-or-query')
                .setDescription(
                  'The link of the track, or the query to use for searching'
                )
                .setRequired(true)
            )
        )
    );
  }

  public async chatInputRun(interaction: ChatInputCommand.Interaction) {
    if (interaction.channel === null) {
      interaction.reply({
        content: '❓ | Cannot find channel.',
        ephemeral: true
      });
      return;
    }

    const voiceChannel = (interaction.member as GuildMember).voice.channel;

    if (voiceChannel === null) {
      interaction.reply({
        content: '❓ | Cannot find voice channel.',
        ephemeral: true
      });
      return;
    }

    const guildQueueData = createGuildMusicData(
      interaction.guildId as string,
      voiceChannel,
      interaction.channel
    ).queueSystemData;

    let source = interaction.options.getSubcommand(true) as
      | 'youtube'
      | 'yt_music'
      | 'soundcloud';
    const linkOrQuery = interaction.options.getString('link-or-query', true);

    if (linkOrQuery.length < 3) {
      interaction.reply('Search query is too short!');
      return;
    }

    let linkOrQueryType = await playdl.validate(linkOrQuery);

    if (linkOrQueryType === false) {
      linkOrQueryType = 'search';
    }

    if (
      linkOrQueryType === 'yt_playlist' ||
      linkOrQueryType === 'so_playlist'
    ) {
      interaction.reply({
        content: 'Playlist detected. Use the `addplaylist` command instead.',
        ephemeral: true
      });
      return;
    }

    if (linkOrQueryType.startsWith('yt_') && source === 'soundcloud') {
      await interaction.reply({
        content:
          'YouTube link detected. Using the `youtube` subcommand instead.'
      });

      source = 'youtube';
    }

    if (linkOrQueryType.startsWith('so_') && source !== 'soundcloud') {
      await interaction.reply({
        content:
          'SoundCloud link detected. Using the `soundcloud` subcommand instead.'
      });

      source = 'soundcloud';
    }

    if (!interaction.replied) {
      await interaction.deferReply();
    }

    let searchResult: TrackInfo;
    let cacheStatus: TrackCacheResult['cacheData'] | undefined;

    if (source === 'youtube') {
      try {
        const search = await searchYoutube(linkOrQuery, {
          limit: 1
        });

        if (!Array.isArray(search)) {
          cacheStatus = search.cacheData;
          searchResult = search.data;
        } else {
          searchResult = search[0];
        }
      } catch (error) {
        if (error instanceof Error) {
          interaction.editReply({
            content: `❌ | ${error.message}`
          });
        } else {
          interaction.editReply({
            content: `❌ | An error occurred while searching for ${YouTubeVideoNaming.trackIdentifier}s.`
          });
        }

        return;
      }
    } else if (source === 'yt_music') {
      try {
        const search = await searchYTMusic(linkOrQuery, {
          limit: 1
        });

        if (!Array.isArray(search)) {
          cacheStatus = search.cacheData;
          searchResult = search.data;
        } else {
          searchResult = search[0];
        }
      } catch (error) {
        if (error instanceof Error) {
          interaction.editReply({
            content: `❌ | ${error.message}`
          });
        } else {
          interaction.editReply({
            content: `❌ | An error occurred while searching for ${YTMusicTrackNaming.trackIdentifier}s.`
          });
        }

        return;
      }
    } else {
      try {
        const search = await searchSoundCloud(linkOrQuery, {
          limit: 1
        });

        if (!Array.isArray(search)) {
          cacheStatus = search.cacheData;
          searchResult = search.data;
        } else {
          searchResult = search[0];
        }
      } catch (error) {
        if (error instanceof Error) {
          interaction.editReply({
            content: `❌ | ${error.message}`
          });
        } else {
          interaction.editReply({
            content: `❌ | An error occurred while searching for ${SoundCloudTrackNaming.trackIdentifier}s.`
          });
        }

        return;
      }
    }

    const queuedTrack = new QueuedTrackInfo(searchResult, interaction.user);

    guildQueueData.trackList.push(queuedTrack);

    const namings = getTrackNamings(queuedTrack);

    const baseEmbed = new EmbedBuilder()
      .setColor(ColorPalette.Success)
      .setTitle(`Added ${namings.fullIdentifier} to queue`);

    if (cacheStatus !== undefined) {
      baseEmbed.setFooter({
        text: `Cache ${
          cacheStatus.status
        }, cached on ${cacheStatus.cachedAt.toLocaleString()}`
      });
    }

    const embed = createFancyEmbedFromTrack(baseEmbed, queuedTrack);

    interaction.editReply({ content: null, embeds: [embed] });

    startQueuePlayback(interaction.guildId as string);
  }
}
