import { ChatInputCommand, Command } from '@sapphire/framework';

import { getAudioPlayer } from '../../../functions/music-utilities/getAudioPlayer';

export class ResumePlaybackCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'resume',
      aliases: [],
      description: 'Resumes the video.',
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

    if (audioPlayer.state.status === 'playing') {
      interaction.reply('❓ | The video is already playing.');
      return;
    }

    audioPlayer.unpause();
    interaction.reply('▶️ | Resumed the video.');
    return;
  }
}
