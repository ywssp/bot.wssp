import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';
import { formatVideoField } from '../../../functions/music-utilities/YouTube/formatVideoField';

import { ColorPalette } from '../../../settings/ColorPalette';

export class RemoveVideoCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'remove',
      aliases: [],
      description: 'Removes an amount of videos from the queue.',
      runIn: 'GUILD_ANY',
      preconditions: ['InVoiceChannel', 'IsPlaying', 'IsPlayingYoutube']
    });
  }

  public override registerApplicationCommands(
    registry: ChatInputCommand.Registry
  ) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addIntegerOption((option) =>
          option
            .setName('start')
            .setDescription(
              'Where the removal should start. Defaults to the last video on the queue'
            )
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName('amount')
            .setDescription('The amount of videos to remove. Defaults to 1')
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName('end')
            .setDescription(
              'Where the removal should end. Overrides the "amount" option'
            )
            .setRequired(false)
        )
    );
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildMusicData = getGuildMusicData(
      interaction.guildId as string
    )?.youtubeData;

    if (
      guildMusicData === undefined ||
      guildMusicData.getQueue().length === 0
    ) {
      interaction.reply('The queue is empty.');
      return;
    }

    const removalStart =
      guildMusicData.videoListIndex +
      (interaction.options.getInteger('start') ?? 1);
    const removalAmount = interaction.options.getInteger('amount') ?? 1;
    const removalEnd =
      removalStart + (interaction.options.getInteger('end') ?? removalAmount);

    if (
      removalStart <= guildMusicData.videoListIndex ||
      removalStart >= guildMusicData.videoList.length
    ) {
      interaction.reply({
        content: '⛔ | The start index is out of bounds.',
        ephemeral: true
      });
      return;
    }

    if (removalAmount < 1) {
      interaction.reply({
        content: '⛔ | The amount of videos to remove must be at least 1.',
        ephemeral: true
      });
      return;
    }

    if (
      removalEnd < removalStart ||
      removalEnd > guildMusicData.videoList.length
    ) {
      interaction.reply({
        content: '⛔ | The end index is out of bounds.',
        ephemeral: true
      });
      return;
    }

    const removedVideos = guildMusicData.videoList.splice(
      removalStart,
      removalEnd - removalStart
    );

    const embed = new MessageEmbed()
      .setColor(ColorPalette.error)
      .setTitle(`Removed ${removedVideos.length} videos from the queue`)
      .setFields(
        removedVideos.slice(0, 9).map((video) => formatVideoField(video))
      );

    if (removedVideos.length > 8) {
      embed.addFields({
        name: '\u200b',
        value: `And ${removedVideos.length - 9} more videos.`
      });
    }

    interaction.reply({ embeds: [embed] });
    return;
  }
}
