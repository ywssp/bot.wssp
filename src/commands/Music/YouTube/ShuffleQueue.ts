import { ChatInputCommand, Command } from '@sapphire/framework';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';

export class ShuffleQueueCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'shuffle',
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
    const guildYoutubeData = getGuildMusicData(
      interaction.guildId as string
    )?.youtubeData;

    if (
      typeof guildYoutubeData === 'undefined' ||
      guildYoutubeData.getQueue().length === 0
    ) {
      interaction.reply({
        content: '❓ | The queue is empty.',
        ephemeral: true
      });
      return;
    }

    const queue = guildYoutubeData.videoList.slice(
      guildYoutubeData.videoListIndex + 1
    );

    // Shuffle the queue
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    guildYoutubeData.videoList.splice(
      guildYoutubeData.videoListIndex + 1,
      guildYoutubeData.videoList.length - guildYoutubeData.videoListIndex - 1,
      ...queue
    );

    interaction.reply('🔀 | Shuffled the queue.');
    return;
  }
}
