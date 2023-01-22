import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder, inlineCode } from 'discord.js';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';
import { formatVideoField } from '../../../functions/music-utilities/YouTube/formatVideoField';
import { createPagedEmbed } from '../../../functions/createPagedEmbed';

import { ColorPalette } from '../../../settings/ColorPalette';

export class DisplayQueueCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'queue',
      description: 'Displays the music queue of the server.',
      runIn: 'GUILD_ANY',
      preconditions: ['HasGuildMusicData']
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

    const queue = guildYoutubeData?.getQueue();

    if (
      queue === undefined ||
      (queue.length === 0 && guildYoutubeData?.loop.type !== 'track')
    ) {
      interaction.reply('❓ | The queue is empty.');
      return;
    }

    const queueFields = queue.map((video, index) =>
      formatVideoField(video, `${index + 1}. `)
    );

    let description = '';

    if (guildYoutubeData.shuffle) {
      description =
        '🔀 | The queue is shuffled. Songs will be played in a random order.';
    }

    if (guildYoutubeData.loop.type === 'track') {
      description === '' ? (description = '') : (description += '\n');
      const currentVideo = guildYoutubeData.currentVideo();
      description += `🔂 | ${inlineCode(currentVideo.title)} by ${inlineCode(
        currentVideo.channel.name
      )} is looping.`;
    }

    const embed = new EmbedBuilder()
      .setColor(ColorPalette.default)
      .setTitle('Queue')
      .setDescription(description);

    createPagedEmbed(interaction, queueFields, embed);
    return;
  }
}
