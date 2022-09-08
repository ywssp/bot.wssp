import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import { chunk } from 'lodash';
import { createPagedEmbed } from '../../functions/music-utilities/createPagedEmbed';
import { getGuildMusicData } from '../../functions/music-utilities/getGuildMusicData';

export class DisplayHistoryCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'history',
      aliases: [],
      description: 'Displays the music history of the server.',
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

    const history = guildMusicData?.getHistory();

    if (typeof history === 'undefined' || history.length === 0) {
      interaction.reply('❓ | The video history is empty.');
      return;
    }

    const historyChunks = chunk(
      history
        .map((video) => ({
          name: `${video.title}`,
          value: `[Link](${video.url}) | ${
            typeof video.duration === 'string'
              ? video.duration
              : video.duration.toFormat('m:ss')
          } | By [${video.channel.name}](${video.channel.url})`
        }))
        .reverse(),
      10
    );

    const embed = new MessageEmbed().setColor('#88c0d0').setTitle('History');

    if (historyChunks.length === 1) {
      embed.addFields(historyChunks[0]);

      interaction.reply({ embeds: [embed] });
      return;
    }

    createPagedEmbed(interaction, historyChunks, embed);
  }
}
