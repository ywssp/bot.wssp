'use strict';

import { ChatInputCommand, Command } from '@sapphire/framework';

import { getGuildMusicData } from '../../../functions/music-utilities/guildMusicDataManager';

export class ClearTrackListCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'clear',
      description: 'Clears the track history or queue.',
      runIn: 'GUILD_ANY',
      preconditions: ['InVoiceChannel', 'HasGuildMusicData']
    });
  }

  public override registerApplicationCommands(
    registry: ChatInputCommand.Registry
  ) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((subcommand) =>
          subcommand.setName('queue').setDescription('Clears the track queue.')
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('history')
            .setDescription('Clears the track history.')
        )
    );
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    const guildMusicData = getGuildMusicData(interaction.guildId as string);

    if (
      guildMusicData === undefined ||
      guildMusicData.queueSystemData.trackList.length === 0
    ) {
      interaction.reply({
        content: 'The track list is empty.',
        ephemeral: true
      });
      return;
    }

    const guildQueueData = guildMusicData.queueSystemData;

    if (interaction.options.getSubcommand() === 'queue') {
      guildQueueData.trackList.splice(guildQueueData.trackListIndex + 1);

      interaction.reply('🗑 | Cleared the track queue.');
    }
    if (interaction.options.getSubcommand() === 'history') {
      guildQueueData.trackList.splice(0, guildQueueData.trackListIndex);
      guildQueueData.trackListIndex = 0;

      interaction.reply('🗑 | Cleared the track history.');
    }

    return;
  }
}
