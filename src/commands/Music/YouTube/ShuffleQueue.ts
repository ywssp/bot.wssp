import { ChatInputCommand, Command } from '@sapphire/framework';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';

export class ShuffleQueueCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'shuffle',
      aliases: [],
      description: 'Shuffles the queue.',
      runIn: 'GUILD_ANY',
      preconditions: ['InVoiceChannel', 'IsPlaying']
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
    const guildMusicData = getGuildMusicData({
      create: false,
      guildId: interaction.guildId as string
    })?.youtubeData;

    if (
      typeof guildMusicData === 'undefined' ||
      guildMusicData.getQueue().length === 0
    ) {
      interaction.reply({
        content: '❓ | The queue is empty.',
        ephemeral: true
      });
      return;
    }

    const queue = guildMusicData.videoList.splice(
      guildMusicData.videoListIndex + 1,
      guildMusicData.videoList.length - guildMusicData.videoListIndex - 1
    );

    // Shuffle the queue
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    guildMusicData.videoList.push(...queue);

    interaction.reply('🔀 | Shuffled the queue.');
    return;
  }
}
