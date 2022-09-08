import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import { chunk } from 'lodash';
import { createPagedEmbed } from '../../functions/music-utilities/createPagedEmbed';
import { getGuildMusicData } from '../../functions/music-utilities/getGuildMusicData';

export class DisplayQueueCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'queue',
      aliases: [],
      description: 'Displays the music queue of the server.',
      runIn: 'GUILD_ANY'
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
    });

    const queue = guildMusicData?.getQueue();

    if (
      typeof queue === 'undefined' ||
      (queue.length === 0 && guildMusicData?.loop.type !== 'track')
    ) {
      interaction.reply('❓ | The queue is empty.');
      return;
    }

    const queueChunks = chunk(
      queue.map((video, index) => ({
        name: `${index + 1}. ${video.title}`,
        value: `[Link](${video.url}) | ${
          typeof video.duration === 'string'
            ? video.duration
            : video.duration.toFormat('m:ss')
        } | By [${video.channel.name}](${video.channel.url})`
      })),
      10
    );

    if (guildMusicData?.loop.type === 'track') {
      const loopedVideo =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        guildMusicData!.videoList[guildMusicData!.videoListIndex];

      queueChunks[0].unshift({
        name: `🔂 ${loopedVideo.title}`,
        value: `[Link](${loopedVideo.url}) | ${
          typeof loopedVideo.duration === 'string'
            ? loopedVideo.duration
            : loopedVideo.duration.toFormat('m:ss')
        } | By [${loopedVideo.channel.name}](${loopedVideo.channel.url})`
      });
    }

    const embed = new MessageEmbed().setColor('#88c0d0').setTitle('Queue');

    if (queueChunks.length === 1) {
      embed.addFields(queueChunks[0]);

      interaction.reply({ embeds: [embed] });
      return;
    }

    createPagedEmbed(interaction, queueChunks, embed);
    return;
  }
}
