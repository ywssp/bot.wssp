import {
  Listener,
  UserError,
  ChatInputCommandDeniedPayload
} from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import { ColorPalette } from '../settings/ColorPalette';

export class ChatInputCommandDeniedListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'chatInputCommandDenied'
    });
  }
  public run(error: UserError, { interaction }: ChatInputCommandDeniedPayload) {
    const embed = new MessageEmbed()
      .setColor(ColorPalette.error)
      .setTitle('Cannot run command')
      .setDescription(error.message);

    interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
