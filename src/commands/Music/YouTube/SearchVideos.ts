import { ChatInputCommand, Command } from '@sapphire/framework';
import {
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  MessageComponentInteraction,
  EmbedBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';

import ytsr from 'ytsr';
import { getPlayingType } from '../../../functions/music-utilities/getPlayingType';

import { createGuildMusicData } from '../../../functions/music-utilities/guildMusicDataManager';
import { checkVideoCache } from '../../../functions/music-utilities/YouTube/CheckVideoCache';
import { formatVideoEmbed } from '../../../functions/music-utilities/YouTube/formatVideoEmbed';
import { startQueuePlayback } from '../../../functions/music-utilities/YouTube/startQueuePlayback';
import { QueuedYTVideoInfo } from '../../../interfaces/YTVideoInfo';

import { ColorPalette } from '../../../settings/ColorPalette';

export class SearchVideosCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'search',
      description: 'Searches for multiple videos on YouTube.',
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
            .setName('query')
            .setDescription('The search query.')
            .setRequired(true)
        )
    );
  }

  public async chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildYoutubeData = createGuildMusicData(
      interaction.guildId as string,
      interaction.channelId
    ).youtubeData;

    const query = interaction.options.getString('query') as string;

    if (query.length < 3) {
      interaction.reply({
        content: 'The query must be at least 3 characters long.',
        ephemeral: true
      });
      return;
    }

    interaction.deferReply();

    const searchFilter = (await ytsr.getFilters(query))
      .get('Type')
      ?.get('Video');
    const searchResults = await ytsr(searchFilter?.url as string, { limit: 5 });

    if (searchResults.items.length === 0) {
      interaction.editReply({
        content: 'No videos found.'
      });

      return;
    }

    const actionRows = [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        [1, 2, 3, 4, 5].map((number) =>
          new ButtonBuilder()
            .setCustomId('video' + number.toString())
            .setLabel(number.toString())
            .setStyle(ButtonStyle.Secondary)
        )
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🛑')
      )
    ];

    const selectionEmbed = new EmbedBuilder()
      .setColor(ColorPalette.selection)
      .setTitle('Select a video')
      .addFields(
        (searchResults.items as ytsr.Video[]).map((item, index) => ({
          name: `${index + 1}. ${item.title}`,
          value: `[Link](${item.url}) ${
            item.author ? `| [${item.author.name}](${item.author.url})` : ''
          } | ${item.duration ? item.duration : 'Live Stream'}`
        }))
      );

    const selectionMessage = await interaction.channel?.send({
      embeds: [selectionEmbed],
      components: actionRows
    });

    if (selectionMessage === undefined) {
      interaction.editReply('🚫 | Failed to send selection message.');
      return;
    }

    let collected;

    try {
      collected = await selectionMessage.awaitMessageComponent({
        filter: (i: MessageComponentInteraction) => {
          i.deferUpdate();
          return i.user.id === interaction.user.id;
        },
        time: 15000,
        componentType: ComponentType.Button
      });
    } catch (e) {
      interaction.editReply('🛑 | No video selected.');
      selectionMessage.delete();
      return;
    }

    selectionMessage.delete();

    if (collected.customId === 'cancel') {
      selectionMessage.delete();
      interaction.editReply({
        content: '🛑 | Selection cancelled.'
      });
      return;
    }

    const videoIndex = parseInt(collected.customId.replace('video', ''));

    const videoCacheResult = await checkVideoCache(
      (searchResults.items[videoIndex - 1] as ytsr.Video).id
    );
    const video = videoCacheResult.data;
    const cacheStatus = videoCacheResult.cacheData;

    const queuedVideo = new QueuedYTVideoInfo(video, interaction.user);
    guildYoutubeData.videoList.push(queuedVideo);

    const baseEmbed = new EmbedBuilder()
      .setColor(ColorPalette.success)
      .setTitle('Added video to queue')
      .setFooter({
        text: `Cache ${
          cacheStatus.status
        }, cached on ${cacheStatus.cachedAt.toLocaleString()}`
      });

    const replyEmbed = formatVideoEmbed(baseEmbed.data, queuedVideo);

    if (video.thumbnail) {
      replyEmbed.setThumbnail(video.thumbnail);
    }

    interaction.editReply({ embeds: [replyEmbed] });

    if (getPlayingType(interaction.guildId as string) !== 'youtube') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const voiceChannel = (interaction.member as GuildMember)!.voice.channel!;

      startQueuePlayback(interaction.guildId as string, voiceChannel);
    }
  }
}
