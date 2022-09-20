import { ChatInputCommand, Command } from '@sapphire/framework';

import { getAudioPlayer } from '../../../functions/music-utilities/getAudioPlayer';

export class PausePlaybackCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'pause',
      aliases: [],
      description: 'Pauses the video playing.',
      runIn: 'GUILD_ANY',
      preconditions: ['InVoiceChannel', 'IsPlaying', 'IsPlayingYoutube']
    });
  }

  public override registerApplicationCommands(
    registry: ChatInputCommand.Registry
  ) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    const audioPlayer = getAudioPlayer(interaction.guildId as string);

    if (audioPlayer === undefined) {
      interaction.reply('❓ | There is no video playing.');
      return;
    }

    if (audioPlayer.state.status === 'paused') {
      interaction.reply('❓ | The video is already paused.');
      return;
    }

    audioPlayer.pause();
    interaction.reply('⏸️ | Paused the video.');
    return;
  }
}
