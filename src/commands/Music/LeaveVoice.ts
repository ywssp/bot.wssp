import { ChatInputCommand, Command } from '@sapphire/framework';

import {
  getVoiceConnection,
  VoiceConnectionReadyState
} from '@discordjs/voice';

import {
  getGuildMusicData,
  GuildMusicData
} from '../../functions/music-utilities/getGuildMusicData';

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
        .addStringOption((option) =>
          option
            .setName('clear')
            .setDescription('What to clear after leaving the voice channel.')
            .setRequired(false)
            .addChoices(
              { name: 'Queue - Clears the queue', value: 'queue' },
              { name: 'Data - Clears all of the data', value: 'data' }
            )
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

    const guildMusicData = getGuildMusicData({
      create: false,
      guildId: interaction.guildId as string
    }) as GuildMusicData;

    const clear = interaction.options.getString('clear');

    switch (clear) {
      case 'queue':
        guildMusicData.videoList.splice(
          guildMusicData.videoListIndex,
          guildMusicData.videoList.length - guildMusicData.videoListIndex
        );
        break;
      case 'data':
        this.container.guildMusicDataMap.delete(interaction.guildId as string);
        break;
      default:
        break;
    }

    const voiceChannelName = interaction.guild?.me?.voice.channel?.name;

    audioPlayer.removeAllListeners();
    audioPlayer.stop();
    voiceConnection.destroy();
    interaction.reply(`🛑 | Left the voice channel \`${voiceChannelName}\``);
    return;
  }
}
