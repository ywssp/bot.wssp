'use strict';

import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder, type Client } from 'discord.js';

import { DateTime, Duration } from 'luxon';

import { ColorPalette } from '../../settings/ColorPalette';

export class BotInfoCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'botinfo',
      description: 'Displays information about the bot'
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
    const embed = this.createEmbed(interaction.client);

    interaction.reply({ embeds: [embed] });
  }

  private createEmbed(client: Client) {
    const embed = new EmbedBuilder()
      .setColor(ColorPalette.Default)
      .setTitle('Bot Information');

    if (client.user) {
      embed.addFields({ name: 'Name', value: client.user.tag, inline: true });
      embed.setThumbnail(client.user.displayAvatarURL());
    }

    if (client.readyTimestamp) {
      let botReadyTimestamp = DateTime.fromMillis(
        client.readyTimestamp
      ).toFormat('D, t ZZZZ');

      if (client.uptime) {
        const uptimeDuration = Duration.fromMillis(client.uptime).shiftTo(
          'days',
          'hours',
          'minutes',
          'seconds',
          'milliseconds'
        );
        botReadyTimestamp += uptimeDuration.toFormat(
          "\n'Uptime: 'd' days, 'h' hours, 'm' minutes, and 's' seconds"
        );
      }

      embed.addFields({
        name: 'Started In',
        value: botReadyTimestamp,
        inline: true
      });
    }

    return embed;
  }
}
