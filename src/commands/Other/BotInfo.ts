import { ChatInputCommand, Command } from '@sapphire/framework';
import type { Client, Message } from 'discord.js';
import { MessageEmbed } from 'discord.js';

import { DateTime, Duration } from 'luxon';

export class EmbedTestCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'botinfo',
      aliases: [],
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

  public messageRun(message: Message) {
    const embed = this.createEmbed(message.client);

    message.channel.send({ embeds: [embed] });
  }

  public chatInputRun(interaction: ChatInputCommand.Interaction) {
    const embed = this.createEmbed(interaction.client);

    interaction.reply({ embeds: [embed] });
  }

  private createEmbed(client: Client) {
    const embed = new MessageEmbed()
      .setColor('#88c0d0')
      .setTitle('Bot Information');

    if (client.user) {
      embed.addField('Name', client.user.tag, true);
      embed.setThumbnail(client.user.displayAvatarURL());
    }

    if (client.readyTimestamp) {
      let botReadyTimestamp = DateTime.fromMillis(
        client.readyTimestamp
      ).toFormat('D, t ZZZZ');

      if (client.uptime) {
        const uptimeDuration = Duration.fromMillis(client.uptime)
          .shiftTo('days', 'hours', 'minutes', 'seconds', 'milliseconds')
          .toObject();
        botReadyTimestamp += `\nUptime: ${uptimeDuration.days}d ${uptimeDuration.hours}h ${uptimeDuration.minutes}m ${uptimeDuration.seconds}s`;
      }

      embed.addField('Started in', botReadyTimestamp, true);
    }

    return embed;
  }
}
