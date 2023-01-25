import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder, GuildMember } from 'discord.js';

import ytdl from 'ytdl-core';
import ytpl from 'ytpl';

import { createGuildMusicData } from '../../../functions/music-utilities/guildMusicDataManager';
import { QueuedYTVideoInfo } from '../../../interfaces/YTVideoInfo';
import { startQueuePlayback } from '../../../functions/music-utilities/YouTube/startQueuePlayback';

import { ColorPalette } from '../../../settings/ColorPalette';
import { getPlayingType } from '../../../functions/music-utilities/getPlayingType';

export class AddPlaylistCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'addplaylist',
      description: 'Adds the contents of a YouTube playlist to the queue.',
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
            .setName('link')
            .setDescription('The link of the YouTube playlist.')
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName('loop')
            .setDescription('Whether to loop the playlist.')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('modifier')
            .setDescription('The modifier to use when adding the playlist.')
            .setRequired(false)
            .setChoices({
              name: 'Reverse',
              value: 'reverse'
            })
        )
    );
  }

  public async chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildYoutubeData = createGuildMusicData(
      interaction.guildId as string,
      interaction.channelId
    ).youtubeData;

    const link = interaction.options.getString('link') as string;

    if (!ytpl.validateID(link)) {
      interaction.reply({
        content: '❓ | Invalid playlist link.',
        ephemeral: true
      });
      return;
    }

    interaction.reply('Processing playlist...');

    const playlist = await ytpl(link, {
      limit: Infinity
    });

    const processedVideos = await Promise.allSettled(
      playlist.items.map((video) => ytdl.getBasicInfo(video.url))
    );

    const videos = (
      processedVideos.filter(
        (result) =>
          result.status === 'fulfilled' && !result.value.videoDetails.isPrivate
      ) as PromiseFulfilledResult<ytdl.videoInfo>[]
    ).map((result) => new QueuedYTVideoInfo(result.value, interaction.user));

    if (videos.length === 0) {
      interaction.editReply({
        content: '❌ | No videos were found in the playlist.'
      });
      return;
    }

    if (interaction.options.getBoolean('loop')) {
      guildYoutubeData.setLoopType('queue');
    }

    switch (interaction.options.getString('modifier') as 'reverse' | null) {
      case 'reverse':
        videos.reverse();
        break;
      default:
        break;
    }

    const embed = new EmbedBuilder()
      .setColor(ColorPalette.success)
      .setTitle('Playlist Added to queue')
      .addFields([
        {
          name: 'Playlist',
          value: `[${playlist.title}](${playlist.url})`
        },
        {
          name: 'Author',
          value: `[${playlist.author.name}](${playlist.author.url})`
        },
        {
          name: 'Length',
          value: `${videos.length}/${playlist.items.length} playable videos`
        }
      ]);

    if (playlist.bestThumbnail.url !== null) {
      embed.setThumbnail(playlist.bestThumbnail.url);
    }

    interaction.editReply({
      content: null,
      embeds: [embed]
    });

    guildYoutubeData.videoList.push(...videos);

    if (getPlayingType(interaction.guildId as string) !== 'youtube') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const voiceChannel = (interaction.member as GuildMember)!.voice.channel!;

      startQueuePlayback(interaction.guildId as string, voiceChannel);
    }
  }
}
