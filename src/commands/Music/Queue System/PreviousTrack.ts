'use strict';

import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

import { getGuildMusicData } from '../../../functions/music-utilities/guildMusicDataManager';

import { ColorPalette } from '../../../settings/ColorPalette';
import { getAudioPlayer } from '../../../functions/music-utilities/getAudioPlayer';
import { createEmbedFromTrackArray } from '../../../functions/music-utilities/queue-system/createEmbedFromTrackArray';
import { startQueuePlayback } from '../../../functions/music-utilities/queue-system/startQueuePlayback';

export class PreviousTrackCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'previous',
      description: 'Plays a track from the music history.',
      runIn: 'GUILD_ANY',
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
        .addIntegerOption((option) =>
          option
            .setName('number')
            .setDescription('The number of tracks to backtrack. Defaults to 1')
            .setMinValue(1)
            .setRequired(false)
        )
    );
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildMusicData = getGuildMusicData(interaction.guildId as string);

    if (
      guildMusicData === undefined ||
      guildMusicData.queueSystemData.getHistory().length === 0
    ) {
      interaction.reply('❓ | The track history is empty.');
      return;
    }

    const guildQueueData = guildMusicData.queueSystemData;

    const skipNumber = interaction.options.getInteger('number') ?? 1;

    if (skipNumber < 1 || skipNumber > guildQueueData.trackListIndex) {
      interaction.reply({
        content: `⛔ | Invalid number. The number must be between \`1-${guildQueueData.trackListIndex}\`.`,
        ephemeral: true
      });
      return;
    }

    const skippedTracks = guildQueueData.trackList.slice(
      guildQueueData.trackListIndex - skipNumber + 1,
      guildQueueData.trackListIndex + 1
    );

    const embed = new EmbedBuilder().setColor(ColorPalette.Notice);

    guildQueueData.modifyIndex(-skipNumber);
    guildQueueData.skipped = true;

    const audioPlayer = getAudioPlayer(interaction.guildId as string);

    // Resume playback if the guild isn't playing from the queue system
    if (guildQueueData.playing === false || audioPlayer === undefined) {
      startQueuePlayback(interaction.guildId as string);

      let title = `Resuming queue playback from the end`;

      if (skippedTracks.length !== 0) {
        title += `, backtracking ${skippedTracks.length} track${
          skippedTracks.length > 1 ? 's' : ''
        }`;
      }

      embed.setTitle(title);
    } else {
      audioPlayer.stop();
      embed.setTitle(
        `Backtracked ${skippedTracks.length} track${
          skippedTracks.length > 1 ? 's' : ''
        } from the queue`
      );
    }

    interaction.reply({
      embeds: [createEmbedFromTrackArray(embed, skippedTracks)]
    });
    return;
  }
}
