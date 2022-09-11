import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import { chunk } from 'lodash';
import { createPagedEmbed } from '../../functions/createPagedEmbed';
import { formatVideoField } from '../../functions/music-utilities/formatVideoField';
import { getGuildMusicData } from '../../functions/music-utilities/getGuildMusicData';
import { ColorPalette } from '../../settings/ColorPalette';

export class DisplayQueueCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'queue',
      aliases: [],
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
    const guildMusicData = getGuildMusicData({
      create: false,
      guildId: interaction.guildId as string
    })!;

    const queue = guildMusicData.getQueue();

    if (queue.length === 0 && guildMusicData?.loop.type !== 'track') {
      interaction.reply('❓ | The queue is empty.');
      return;
    }

    const queueChunks = chunk(
      queue.map((video, index) => formatVideoField(video, `${index + 1}. `)),
      10
    );

    if (guildMusicData.loop.type === 'track') {
      queueChunks[0].unshift(
        formatVideoField(guildMusicData.currentVideo(), '🔂 ')
      );
    }

    const embed = new MessageEmbed()
      .setColor(ColorPalette.default)
      .setTitle('Queue');

    if (queueChunks.length === 1) {
      embed.addFields(queueChunks[0]);

      interaction.reply({ embeds: [embed] });
      return;
    }

    createPagedEmbed(interaction, queueChunks, embed);
    return;
  }
}
