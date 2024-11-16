'use strict';

import {
  ChatInputCommandDeniedPayload,
  Listener,
  UserError
} from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';

import { ColorPalette } from '../../settings/ColorPalette';

export class ChatInputCommandDeniedListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'chatInputCommandDenied'
    });
  }
  public run(error: UserError, { interaction }: ChatInputCommandDeniedPayload) {
    const embed = new EmbedBuilder()
      .setColor(ColorPalette.Error)
      .setTitle('Cannot run command')
      .setDescription(error.message);

    interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
