'use strict';

import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

import { getGuildMusicData } from '../../../functions/music-utilities/guildMusicDataManager';
import { createEmbedFromTrackArray } from '../../../functions/music-utilities/queue-system/createEmbedFromTrackArray';

import { ColorPalette } from '../../../settings/ColorPalette';

export class RemoveTrackCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'remove',
      description: 'Removes an amount of tracks from the queue.',
      runIn: 'GUILD_ANY',
      preconditions: ['InVoiceChannel', 'IsPlaying']
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
              'Where the removal should start. Defaults to the recently added track in the queue'
            )
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName('amount')
            .setDescription('The amount of tracks to remove. Defaults to 1')
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
    const guildMusicData = getGuildMusicData(interaction.guildId as string);

    if (
      guildMusicData === undefined ||
      guildMusicData.queueSystemData.getQueue().length === 0
    ) {
      interaction.reply('The queue is empty.');
      return;
    }

    const guildQueueData = guildMusicData.queueSystemData;

    let removalStart;

    if (interaction.options.getInteger('start')) {
      removalStart =
        guildQueueData.trackListIndex +
        (interaction.options.getInteger('start') as number);
    } else {
      removalStart = guildQueueData.trackList.length - 1;
    }

    const removalAmount = interaction.options.getInteger('amount') ?? 1;
    const removalEnd =
      removalStart + (interaction.options.getInteger('end') ?? removalAmount);

    if (
      removalStart <= guildQueueData.trackListIndex ||
      removalStart >= guildQueueData.trackList.length
    ) {
      interaction.reply({
        content: '⛔ | The start index is out of bounds.',
        ephemeral: true
      });
      return;
    }

    if (removalAmount < 1) {
      interaction.reply({
        content: '⛔ | The amount of tracks to remove must be at least 1.',
        ephemeral: true
      });
      return;
    }

    if (
      removalEnd < removalStart ||
      removalEnd > guildQueueData.trackList.length
    ) {
      interaction.reply({
        content: '⛔ | The end index is out of bounds.',
        ephemeral: true
      });
      return;
    }

    const removedTracks = guildQueueData.trackList.splice(
      removalStart,
      removalEnd - removalStart
    );

    const embed = new EmbedBuilder()
      .setColor(ColorPalette.Notice)
      .setTitle(
        `Removed ${removedTracks.length} track${
          removedTracks.length > 1 ? 's' : ''
        } from the queue`
      );

    interaction.reply({
      embeds: [createEmbedFromTrackArray(embed, removedTracks)]
    });
    return;
  }
}
