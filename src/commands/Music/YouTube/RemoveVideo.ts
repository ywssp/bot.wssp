import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';
import { createMultiVideoEmbed } from '../../../functions/music-utilities/YouTube/createMultivideoEmbed';

import { ColorPalette } from '../../../settings/ColorPalette';

export class RemoveVideoCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'remove',
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
              'Where the removal should start. Defaults to the recently added video in the queue'
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
    const guildYoutubeData = getGuildMusicData(
      interaction.guildId as string
    )?.youtubeData;

    if (
      guildYoutubeData === undefined ||
      guildYoutubeData.getQueue().length === 0
    ) {
      interaction.reply('The queue is empty.');
      return;
    }

    let removalStart;

    if (interaction.options.getInteger('start')) {
      removalStart =
        guildYoutubeData.videoListIndex +
        (interaction.options.getInteger('start') as number);
    } else {
      removalStart = guildYoutubeData.videoList.length - 1;
    }

    const removalAmount = interaction.options.getInteger('amount') ?? 1;
    const removalEnd =
      removalStart + (interaction.options.getInteger('end') ?? removalAmount);

    if (
      removalStart <= guildYoutubeData.videoListIndex ||
      removalStart >= guildYoutubeData.videoList.length
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
      removalEnd > guildYoutubeData.videoList.length
    ) {
      interaction.reply({
        content: '⛔ | The end index is out of bounds.',
        ephemeral: true
      });
      return;
    }

    const removedVideos = guildYoutubeData.videoList.splice(
      removalStart,
      removalEnd - removalStart
    );

    const embed = new MessageEmbed()
      .setColor(ColorPalette.error)
      .setTitle(
        `Removed ${removedVideos.length} video${
          removedVideos.length > 1 ? 's' : ''
        } from the queue`
      );

    interaction.reply({
      embeds: [createMultiVideoEmbed(embed, removedVideos)]
    });
    return;
  }
}
