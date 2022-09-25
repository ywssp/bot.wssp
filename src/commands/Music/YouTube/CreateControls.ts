import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageActionRow, MessageButton } from 'discord.js';
import { getAudioPlayer } from '../../../functions/music-utilities/getAudioPlayer';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';

export class CreateControlsCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'controls',
      aliases: [],
      description: 'Displays the controls for the music player.',
      runIn: 'GUILD_ANY',
      preconditions: ['InVoiceChannel', 'HasGuildMusicData', 'IsPlayingYoutube']
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const guildYoutubeData = getGuildMusicData(
      interaction.guildId as string
    )!.youtubeData;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const audioPlayer = getAudioPlayer(interaction.guildId as string)!;

    const controlButtons = [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId('previous')
          .setEmoji('⏮️')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('playback')
          .setEmoji(audioPlayer.state.status === 'playing' ? '⏸️' : '▶️')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('next')
          .setEmoji('⏭️')
          .setStyle('PRIMARY')
      ),
      new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId('shuffle')
          .setEmoji('🔀')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('leave')
          .setEmoji('🚪')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('loop')
          .setEmoji(guildYoutubeData.loop.emoji)
          .setStyle('PRIMARY')
      )
    ];

    // Const controlsMessage = interaction.channel ? .send({
    //   Components: controlButtons,
    // }
  }
}
