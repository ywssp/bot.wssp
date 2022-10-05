import { ChatInputCommand, Command } from '@sapphire/framework';
import {
  GuildMember,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
  MessageEmbed
} from 'discord.js';

import ytdl from 'ytdl-core';
import ytsr from 'ytsr';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';
import { SimpleYTVideoInfo } from '../../../interfaces/SimpleYTVideoInfo';
import { formatVideoEmbed } from '../../../functions/music-utilities/YouTube/formatVideoEmbed';
import { playVideo } from '../../../functions/music-utilities/YouTube/playVideo';

import { ColorPalette } from '../../../settings/ColorPalette';

export class PlayMusicCommand extends Command {
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
    const guildYoutubeData = getGuildMusicData({
      guildId: interaction.guildId as string,
      create: true,
      interaction
    }).youtubeData;

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
      new MessageActionRow().addComponents(
        [1, 2, 3, 4, 5].map((number) =>
          new MessageButton()
            .setCustomId('video' + number.toString())
            .setLabel(number.toString())
            .setStyle('SECONDARY')
        )
      ),
      new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId('cancel')
          .setLabel('Cancel')
          .setStyle('DANGER')
          .setEmoji('🛑')
      )
    ];

    const selectionEmbed = new MessageEmbed()
      .setColor(ColorPalette.selection)
      .setTitle('Select a video')
      .addFields(
        (searchResults.items as ytsr.Video[]).map((item, index) => ({
          name: `${index + 1}. ${item.title}`,
          value: `[Link](${item.url}) ${
            item.author ? `| [${item.author.name}](${item.author.url})` : ''
          } | ${item.duration}`
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
        componentType: 'BUTTON'
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

    const video = new SimpleYTVideoInfo(
      await ytdl.getInfo(
        (searchResults.items[videoIndex - 1] as ytsr.Video).url
      ),
      interaction.user
    );

    const isPlaying = guildYoutubeData.isPlaying();
    guildYoutubeData.videoList.push(video);

    const baseEmbed = new MessageEmbed()
      .setColor(ColorPalette.success)
      .setTitle('Added video to queue');

    const replyEmbed = formatVideoEmbed(baseEmbed, video);

    if (video.thumbnail) {
      replyEmbed.setThumbnail(video.thumbnail);
    }

    interaction.editReply({ embeds: [replyEmbed] });

    if (isPlaying && interaction.guild?.me?.voice.channel) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const voiceChannel = (interaction.member as GuildMember)!.voice.channel!;

    playVideo(interaction.guildId as string, voiceChannel);
  }
}
