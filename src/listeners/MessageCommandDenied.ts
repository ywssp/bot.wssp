import {
  Listener,
  UserError,
  MessageCommandDeniedPayload
} from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';

export class MessageCommandDeniedListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'messageCommandDenied'
    });
  }
  public run(error: UserError, { message }: MessageCommandDeniedPayload) {
    const embed = new MessageEmbed()
      .setColor('#ff0000')
      .setTitle('Command Denied')
      .setDescription(error.message);

    message.channel.send({ embeds: [embed] });
  }
}
