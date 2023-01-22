import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

import { getGuildMusicData } from '../../../functions/music-utilities/getGuildMusicData';
import { formatVideoField } from '../../../functions/music-utilities/YouTube/formatVideoField';
import { createPagedEmbed } from '../../../functions/createPagedEmbed';

import { ColorPalette } from '../../../settings/ColorPalette';

export class DisplayHistoryCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'history',
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

    const historyFields = history
      .map((video) => formatVideoField(video))
      .reverse();

    const embed = new EmbedBuilder()
      .setColor(ColorPalette.default)
      .setTitle('History');

    createPagedEmbed(interaction, historyFields, embed);
  }
}
