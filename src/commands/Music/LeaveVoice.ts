import {
  getVoiceConnection,
  VoiceConnectionReadyState
} from '@discordjs/voice';
import { ChatInputCommand, Command } from '@sapphire/framework';
import { getGuildMusicData } from '../../functions/music-utilities/getGuildMusicData';
import { GuildMusicData } from '../../interfaces/GuildMusicData';

export class LeaveVCCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'leave',
      aliases: [],
      description: 'Leaves the voice channel.',
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
        .addBooleanOption((option) =>
          option
            .setName('clear-queue')
            .setDescription('Clears the queue.')
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName('clear-data')
            .setDescription('Clears the music data of the server.')
            .setRequired(false)
        )
    );
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    // This command can only be run inside a guild.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const voiceConnection = getVoiceConnection(interaction.guildId!)!;

    const audioPlayer = (voiceConnection.state as VoiceConnectionReadyState)
      .subscription?.player;

    if (audioPlayer === undefined) {
      interaction.reply('There is no video playing!');
      return;
    }

    const clearQueue = interaction.options.getBoolean('clear-queue') ?? false;
    const clearData = interaction.options.getBoolean('clear-data') ?? false;
    const guildMusicData = getGuildMusicData({
      create: false,
      guildId: interaction.guildId as string
    }) as GuildMusicData;

    if (clearQueue) {
      guildMusicData.videoList.splice(
        guildMusicData.videoListIndex,
        guildMusicData.videoList.length - guildMusicData.videoListIndex
      );
      guildMusicData.videoListIndex = 0;
    }

    if (clearData) {
      this.container.guildMusicDataMap.delete(interaction.guildId as string);
    }

    audioPlayer.removeAllListeners();
    audioPlayer.stop();
    voiceConnection.destroy();
    interaction.reply('🛑');
    return;
  }
}
