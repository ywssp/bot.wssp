import { PaginatedMessageEmbedFields } from '@sapphire/discord.js-utilities';
import { ChatInputCommand } from '@sapphire/framework';
import { EmbedField, EmbedBuilder } from 'discord.js';

/**
 * Creates a paged embed with the given fields and embed template
 * @param interaction The interaction to respond to
 * @param fields The fields to paginate
 * @param embed The embed to use as a template
 */
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
