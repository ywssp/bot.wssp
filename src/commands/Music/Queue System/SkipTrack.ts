import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

import { getGuildMusicData } from '../../../functions/music-utilities/guildMusicDataManager';

import { ColorPalette } from '../../../settings/ColorPalette';
import { getAudioPlayer } from '../../../functions/music-utilities/getAudioPlayer';
import { createEmbedFromTrackArray } from '../../../functions/music-utilities/queue-system/createEmbedFromTrackArray';

export class SkipTrackCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'skip',
      description: 'Skips an amount of tracks.',
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
            .setName('number')
            .setDescription('The number of tracks to skip. Defaults to `1`')
            .setMinValue(1)
            .setRequired(false)
        )
    );
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildMusicData = getGuildMusicData(interaction.guildId as string);

    if (guildMusicData === undefined) {
      interaction.reply('The queue is empty.');
      return;
    }

    const guildYoutubeData = guildMusicData.queueSystemData;

    const audioPlayer = getAudioPlayer(interaction.guildId as string);

    if (audioPlayer === undefined) {
      interaction.reply({
        content: '❓ | There is no track playing.',
        ephemeral: true
      });
      return;
    }

    let skipNumber = interaction.options.getInteger('number') ?? 1;

    if (
      skipNumber < 1 ||
      (guildYoutubeData.trackList.length - 1 - guildYoutubeData.trackListIndex >
        0 &&
        skipNumber >=
          guildYoutubeData.trackList.length - guildYoutubeData.trackListIndex)
    ) {
      interaction.reply({
        content: `⛔ | Invalid number. The number must be between \`1-${
          guildYoutubeData.getQueue().length
        }\`.`,
        ephemeral: true
      });
      return;
    }

    if (guildYoutubeData.trackList.length === 0) {
      skipNumber = 1;
    }

    const skippedTracks = guildYoutubeData.trackList.slice(
      guildYoutubeData.trackListIndex,
      guildYoutubeData.trackListIndex + skipNumber
    );

    const embed = new EmbedBuilder()
      .setColor(ColorPalette.Error)
      .setTitle(
        `Skipped ${skippedTracks.length} track${
          skippedTracks.length > 1 ? 's' : ''
        } from the queue`
      );

    guildYoutubeData.modifyIndex(skipNumber);
    guildYoutubeData.skipped = true;

    audioPlayer.stop();
    interaction.reply({
      embeds: [createEmbedFromTrackArray(embed, skippedTracks)]
    });
    return;
  }
}
