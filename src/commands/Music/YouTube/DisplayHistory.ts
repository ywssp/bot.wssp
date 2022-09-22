import { ChatInputCommand, Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';

import { chunk } from 'lodash';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';
import { formatVideoField } from '../../../functions/music-utilities/YouTube/formatVideoField';
import { createPagedEmbed } from '../../../functions/createPagedEmbed';

import { ColorPalette } from '../../../settings/ColorPalette';

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
    const history = getGuildMusicData(
      interaction.guildId as string
    )?.youtubeData.getHistory();

    if (history === undefined || history.length === 0) {
      interaction.reply('❓ | The video history is empty.');
      return;
    }

    const historyChunks = chunk(
      history.map((video) => formatVideoField(video)).reverse(),
      10
    );

    const embed = new MessageEmbed()
      .setColor(ColorPalette.default)
      .setTitle('History');

    if (historyChunks.length === 1) {
      embed.addFields(historyChunks[0]);

      interaction.reply({ embeds: [embed] });
      return;
    }

    createPagedEmbed(interaction, historyChunks, embed);
  }
}
