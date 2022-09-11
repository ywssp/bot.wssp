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
import { SimpleVideoInfo } from '../../interfaces/SimpleVideoInfo';
import { getGuildMusicData } from '../../functions/music-utilities/getGuildMusicData';
import { createVideoObject } from '../../functions/music-utilities/createVideoObject';
import { play } from '../../functions/music-utilities/playInVoiceChannel';
import { ColorPalette } from '../../settings/ColorPalette';
import { formatVideoEmbed } from '../../functions/music-utilities/formatVideoEmbed';

export class PlayMusicCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'search',
      description: 'Searches for multiple videos on YouTube.',
      aliases: [],
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
    const guildMusicData = getGuildMusicData({
      create: true,
      guildId: interaction.guildId as string,
      textChannelId: interaction.channelId
    });

    const query = interaction.options.getString('query');

    if (query === null) {
      interaction.reply({
        content: 'No search query provided.',
        ephemeral: true
      });
      return;
    }

    interaction.deferReply();

    let video: SimpleVideoInfo;

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
        new MessageButton()
          .setCustomId('video1')
          .setLabel('1')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId('video2')
          .setLabel('2')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId('video3')
          .setLabel('3')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId('video4')
          .setLabel('4')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId('video5')
          .setLabel('5')
          .setStyle('SECONDARY')
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

    try {
      const collected = await selectionMessage.awaitMessageComponent({
        filter: (i: MessageComponentInteraction) => {
          i.deferUpdate();
          return i.user.id === interaction.user.id;
        },
        time: 15000,
        componentType: 'BUTTON'
      });

      if (collected.customId === 'cancel') {
        selectionMessage.delete();
        interaction.editReply({
          content: '🛑 | Selection cancelled.'
        });
        return;
      }

      const videoIndex = parseInt(collected.customId.replace('video', ''));

      video = createVideoObject(
        await ytdl.getInfo(
          (searchResults.items[videoIndex - 1] as ytsr.Video).url
        ),
        interaction.user
      );
    } catch (e) {
      interaction.editReply('🛑 | No video selected.');
      selectionMessage.delete();
      return;
    }

    const isPlaying = guildMusicData.isPlaying();
    guildMusicData.videoList.push(video);

    const baseEmbed = new MessageEmbed()
      .setColor(ColorPalette.success)
      .setTitle('Added video to queue');

    const replyEmbed = formatVideoEmbed(video, baseEmbed);

    if (video.thumbnail) {
      replyEmbed.setThumbnail(video.thumbnail);
    }

    selectionMessage.delete();
    interaction.editReply({ embeds: [replyEmbed] });

    if (isPlaying && interaction.guild?.me?.voice.channel) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const voiceChannel = (interaction.member as GuildMember)!.voice.channel!;

    play(interaction.guildId as string, voiceChannel);
  }
}
