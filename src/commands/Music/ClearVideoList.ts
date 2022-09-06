import { ChatInputCommand, Command } from '@sapphire/framework';
import { getGuildMusicData } from '../../functions/music-utilities/getGuildMusicData';

export class ShuffleQueueCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'clear',
      aliases: [],
      description: 'Clears the video history or queue.',
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
    const guildMusicData = getGuildMusicData({
      create: false,
      guildId: interaction.guildId as string
    });

    if (typeof guildMusicData === 'undefined') {
      interaction.reply({
        content: 'The video list is empty.',
        ephemeral: true
      });
      return;
    }

    if (interaction.options.getSubcommand() === 'queue') {
      if (guildMusicData.getQueue().length === 0) {
        interaction.reply({
          content: '❓ | The queue is empty.',
          ephemeral: true
        });
        return;
      }

      guildMusicData.videoList.splice(
        guildMusicData.videoListIndex + 1,
        guildMusicData.videoList.length - guildMusicData.videoListIndex - 1
      );

      interaction.reply('🗑 | Cleared the queue.');
    }
    if (interaction.options.getSubcommand() === 'history') {
      if (guildMusicData.getHistory().length === 0) {
        interaction.reply({
          content: '❓ | The video history is empty.',
          ephemeral: true
        });
        return;
      }

      guildMusicData.videoList.splice(0, guildMusicData.videoListIndex);
      guildMusicData.videoListIndex = 0;

      interaction.reply('🗑 | Cleared the video history.');
    }

    return;
  }
}
