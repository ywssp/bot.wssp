import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder, GuildMember } from 'discord.js';

import play from 'play-dl';

import { createGuildMusicData } from '../../../functions/music-utilities/guildMusicDataManager';
import { QueuedTrack } from '../../../interfaces/YTVideoInfo';
import {
  checkVideoCache,
  VideoCacheResult
} from '../../../functions/music-utilities/YouTube/CheckVideoCache';
import { formatVideoEmbed } from '../../../functions/music-utilities/YouTube/formatVideoEmbed';
import { startQueuePlayback } from '../../../functions/music-utilities/YouTube/startQueuePlayback';

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
    ).youtubeData;

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

    let videoCacheResult: VideoCacheResult;

    try {
      videoCacheResult = await checkVideoCache(videoId);
    } catch (error) {
      interaction.editReply({
        content: '❌ | An error occurred while fetching the video.'
      });
      return;
    }

    const video = videoCacheResult.data;
    const cacheStatus = videoCacheResult.cacheData;

    const queuedVideo = new QueuedTrack(video, interaction.user);
    guildYoutubeData.videoList.push(queuedVideo);

    const baseEmbed = new EmbedBuilder()
      .setColor(ColorPalette.success)
      .setTitle('Added video to queue')
      .setFooter({
        text: `Cache ${
          cacheStatus.status
        }, cached on ${cacheStatus.cachedAt.toLocaleString()}`
      });

    const embed = formatVideoEmbed(baseEmbed.data, queuedVideo);

    interaction.editReply({ content: null, embeds: [embed] });

    if (getPlayingType(interaction.guildId as string) !== 'youtube') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const voiceChannel = (interaction.member as GuildMember)!.voice.channel!;

      startQueuePlayback(interaction.guildId as string, voiceChannel);
    }
  }
}
