import {
  Listener,
  UserError,
  ChatInputCommandDeniedPayload
} from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';

export class ChatInputCommandDeniedListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'chatInputCommandDenied'
    });
  }
  public run(error: UserError, { interaction }: ChatInputCommandDeniedPayload) {
    const embed = new MessageEmbed()
      .setColor('#ff0000')
      .setTitle('Command Denied')
      .setDescription(error.message);

    interaction.reply({ embeds: [embed] });
  }
}
