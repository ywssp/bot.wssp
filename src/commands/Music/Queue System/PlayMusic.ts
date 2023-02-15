import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder, GuildMember } from 'discord.js';

import play from 'play-dl';

import { createGuildMusicData } from '../../../functions/music-utilities/guildMusicDataManager';
import { QueuedTrackInfo } from '../../../interfaces/TrackInfo';
import {
  getTrackFromCache,
  TrackCacheResult
} from '../../../functions/music-utilities/queue-system/getTrackFromCache';
import { createEmbedFromTrack } from '../../../functions/music-utilities/queue-system/createEmbedFromTrack';
import { startQueuePlayback } from '../../../functions/music-utilities/queue-system/startQueuePlayback';

import { ColorPalette } from '../../../settings/ColorPalette';
import { getPlayingType } from '../../../functions/music-utilities/getPlayingType';

export class PlayMusicCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'play',
      description: 'Plays a video from YouTube.',
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
        .addStringOption((option) =>
          option
            .setName('link-or-query')
            .setDescription('The link of the YouTube video, or a search query.')
            .setRequired(true)
        )
    );
  }

  public async chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildYoutubeData = createGuildMusicData(
      interaction.guildId as string,
      interaction.channelId
    ).queueSystemData;

    const linkOrQuery = interaction.options.getString('link-or-query');

    if (linkOrQuery === null) {
      interaction.reply('No link or query provided.');
      return;
    }

    if (play.yt_validate(linkOrQuery) === 'playlist') {
      interaction.reply({
        content: 'Playlist detected. Use the `addplaylist` command instead.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply();

    let videoId: string;

    if ((await play.validate(linkOrQuery)) === 'yt_video') {
      videoId = play.extractID(linkOrQuery);
    } else {
      const searchResults = await play.search(linkOrQuery, {
        source: {
          youtube: 'video'
        },
        limit: 10
      });

      if (searchResults.length === 0) {
        interaction.editReply({
          content: '❓ | No videos found.'
        });

        return;
      }

      videoId = searchResults[0].id ?? play.extractID(searchResults[0].url);
    }

    let videoCacheResult: TrackCacheResult;

    try {
      videoCacheResult = await getTrackFromCache(videoId);
    } catch (error) {
      interaction.editReply({
        content: '❌ | An error occurred while fetching the video.'
      });
      return;
    }

    const video = videoCacheResult.data;
    const cacheStatus = videoCacheResult.cacheData;

    const queuedVideo = new QueuedTrackInfo(video, interaction.user);
    guildYoutubeData.trackList.push(queuedVideo);

    const baseEmbed = new EmbedBuilder()
      .setColor(ColorPalette.Success)
      .setTitle('Added video to queue')
      .setFooter({
        text: `Cache ${
          cacheStatus.status
        }, cached on ${cacheStatus.cachedAt.toLocaleString()}`
      });

    const embed = createEmbedFromTrack(baseEmbed, queuedVideo);

    interaction.editReply({ content: null, embeds: [embed] });

    if (getPlayingType(interaction.guildId as string) !== 'queued_track') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const voiceChannel = (interaction.member as GuildMember)!.voice.channel!;

      startQueuePlayback(interaction.guildId as string, voiceChannel);
    }
  }
}
