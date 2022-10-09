import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';

import { chunk } from 'lodash';

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

    const queuePages = chunk(
      queue.map((video, index) => formatVideoField(video, `${index + 1}. `)),
      10
    );

    if (guildYoutubeData.shuffle) {
      queuePages.forEach((page) =>
        page.unshift({
          name: '🔀 | Shuffle',
          value:
            'The queue is shuffled. The queue is displaying the possible videos that can be played next.'
        })
      );
    }

    if (guildYoutubeData.loop.type === 'track') {
      queuePages[0].unshift(
        formatVideoField(guildYoutubeData.currentVideo(), '🔂 ')
      );
    }

    const embed = new MessageEmbed()
      .setColor(ColorPalette.default)
      .setTitle('Queue');

    if (queuePages.length === 1) {
      embed.addFields(queuePages[0]);

      interaction.reply({ embeds: [embed] });
      return;
    }

    createPagedEmbed(interaction, queuePages, embed);
    return;
  }
}
