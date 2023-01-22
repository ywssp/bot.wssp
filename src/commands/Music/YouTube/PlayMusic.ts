import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder, GuildMember } from 'discord.js';

import ytdl from 'ytdl-core';
import { validateID } from 'ytpl';
import ytsr from 'ytsr';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';
import { QueuedYTVideoInfo } from '../../../interfaces/YTVideoInfo';
import {
  checkVideoCache,
  VideoCacheResult
} from '../../../functions/music-utilities/YouTube/CheckVideoCache';
import { formatVideoEmbed } from '../../../functions/music-utilities/YouTube/formatVideoEmbed';
import { startQueuePlayback } from '../../../functions/music-utilities/YouTube/startQueuePlayback';

import { ColorPalette } from '../../../settings/ColorPalette';

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
    const guildMusicData = getGuildMusicData({
      guildId: interaction.guildId as string,
      create: true,
      interaction
    }).youtubeData;

    const linkOrQuery = interaction.options.getString('link-or-query');

    if (linkOrQuery === null) {
      interaction.reply('No link or query provided.');
      return;
    }

    if (validateID(linkOrQuery)) {
      interaction.reply({
        content: 'Playlist detected. Use the `addplaylist` command instead.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply();

    let videoCacheResult: VideoCacheResult;

    if (ytdl.validateURL(linkOrQuery)) {
      const videoId = ytdl.getURLVideoID(linkOrQuery);

      videoCacheResult = await checkVideoCache(videoId);
    } else {
      const searchResults = await ytsr(linkOrQuery, { limit: 10 });

      if (!searchResults.items.some((item) => item.type === 'video')) {
        interaction.editReply({
          content: '❓ | No videos found.'
        });

        return;
      }

      const foundVideo = searchResults.items.find(
        (item) => item.type === 'video'
      ) as ytsr.Video;

      videoCacheResult = await checkVideoCache(foundVideo.id);
    }

    const video = videoCacheResult.data;
    const cacheStatus = videoCacheResult.cacheData;

    const queuedVideo = new QueuedYTVideoInfo(video, interaction.user);
    guildMusicData.videoList.push(queuedVideo);

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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const voiceChannel = (interaction.member as GuildMember)!.voice.channel!;

    startQueuePlayback(interaction.guildId as string, voiceChannel);
    return;
  }
}
