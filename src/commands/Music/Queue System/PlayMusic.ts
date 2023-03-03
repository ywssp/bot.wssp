import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder, GuildMember } from 'discord.js';

import play, { SoundCloudTrack, YouTubeVideo } from 'play-dl';

import { createGuildMusicData } from '../../../functions/music-utilities/guildMusicDataManager';
import {
  QueuedTrackInfo,
  TrackInfo
} from '../../../interfaces/Music/Queue System/TrackInfo';
import {
  getTrackFromCache,
  storeTrackInCache,
  TrackCacheResult
} from '../../../functions/music-utilities/queue-system/trackCacheManager';
import { createEmbedFromTrack } from '../../../functions/music-utilities/queue-system/createEmbedFromTrack';
import { startQueuePlayback } from '../../../functions/music-utilities/queue-system/startQueuePlayback';

import { ColorPalette } from '../../../settings/ColorPalette';
import { getTrackNamings } from '../../../functions/music-utilities/queue-system/getTrackNamings';

export class PlayMusicCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'play',
      description: 'Plays a track from YouTube or SoundCloud',
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
      | 'soundcloud';
    const linkOrQuery = interaction.options.getString('link-or-query', true);

    if (linkOrQuery.length < 3) {
      interaction.reply('Search query is too short!');
      return;
    }

    let linkOrQueryType = await play.validate(linkOrQuery);

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

    if (linkOrQueryType.startsWith('yt_') && source !== 'youtube') {
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

    let queuedTrack: QueuedTrackInfo;
    let cacheStatus: TrackCacheResult['cacheData'] | undefined;

    if (source === 'youtube') {
      if ((await play.validate(linkOrQuery)) === 'yt_video') {
        let videoCacheResult: TrackCacheResult;
        try {
          videoCacheResult = await getTrackFromCache(linkOrQuery);
        } catch (error) {
          console.log(error);
          interaction.editReply({
            content: '❌ | An error occurred while fetching the video.'
          });
          return;
        }

        queuedTrack = new QueuedTrackInfo(
          videoCacheResult.data,
          interaction.user
        );

        cacheStatus = videoCacheResult.cacheData;
      } else {
        let searchResults: YouTubeVideo[];
        try {
          searchResults = await play.search(linkOrQuery, {
            source: {
              youtube: 'video'
            },
            limit: 10
          });
        } catch (error) {
          interaction.editReply({
            content: '❌ | An error occurred while searching for tracks.'
          });
          return;
        }

        if (searchResults.length === 0) {
          interaction.editReply({
            content: '❓ | No videos found.'
          });

          return;
        }

        storeTrackInCache(new TrackInfo(searchResults[0]));
        queuedTrack = new QueuedTrackInfo(searchResults[0], interaction.user);
      }
    } else if (linkOrQueryType === 'so_track') {
      let trackCacheResult: TrackCacheResult;
      try {
        trackCacheResult = await getTrackFromCache(linkOrQuery);
      } catch (error) {
        interaction.editReply({
          content: '❌ | An error occurred while fetching the track.'
        });
        return;
      }

      queuedTrack = new QueuedTrackInfo(
        trackCacheResult.data,
        interaction.user
      );
      cacheStatus = trackCacheResult.cacheData;
    } else {
      let searchResults: SoundCloudTrack[];

      try {
        searchResults = await play.search(linkOrQuery, {
          source: {
            soundcloud: 'tracks'
          },
          limit: 10
        });
      } catch (error) {
        interaction.editReply({
          content: '❌ | An error occurred while searching for tracks.'
        });
        return;
      }

      if (searchResults.length === 0) {
        interaction.editReply({
          content: '❓ | No tracks found.'
        });

        return;
      }

      storeTrackInCache(new TrackInfo(searchResults[0]));
      queuedTrack = new QueuedTrackInfo(searchResults[0], interaction.user);
    }

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

    const embed = createEmbedFromTrack(baseEmbed, queuedTrack);

    interaction.editReply({ content: null, embeds: [embed] });

    startQueuePlayback(interaction.guildId as string);
  }
}
