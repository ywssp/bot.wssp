import { ChatInputCommand, Command } from '@sapphire/framework';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';

export class ClearVideoListCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'clear',
      description: 'Clears the video history or queue.',
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
          subcommand.setName('queue').setDescription('Clears the queue.')
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('history')
            .setDescription('Clears the video history.')
        )
    );
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const guildYoutubeData = getGuildMusicData(
      interaction.guildId as string
    )!.youtubeData;

    if (guildYoutubeData.videoList.length === 0) {
      interaction.reply({
        content: 'The video list is empty.',
        ephemeral: true
      });
      return;
    }

    if (interaction.options.getSubcommand() === 'queue') {
      guildYoutubeData.videoList.splice(guildYoutubeData.videoListIndex + 1);

      interaction.reply('🗑 | Cleared the video queue.');
    }
    if (interaction.options.getSubcommand() === 'history') {
      guildYoutubeData.videoList.splice(0, guildYoutubeData.videoListIndex);
      guildYoutubeData.videoListIndex = 0;

      interaction.reply('🗑 | Cleared the video history.');
    }

    return;
  }
}
