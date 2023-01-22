import { PaginatedMessageEmbedFields } from '@sapphire/discord.js-utilities';
import { ChatInputCommand } from '@sapphire/framework';
import { EmbedField, EmbedBuilder } from 'discord.js';

export function createPagedEmbed(
  interaction: ChatInputCommand.Interaction,
  fields: EmbedField[],
  embed: EmbedBuilder
) {
  const pagedEmbed = new PaginatedMessageEmbedFields()
    .setTemplate(embed)
    .setItems(fields)
    .setItemsPerPage(10)
    .make();

  pagedEmbed.run(interaction);
}
