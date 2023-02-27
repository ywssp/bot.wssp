import { ChatInputCommand, Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import { ColorPalette } from '../../settings/ColorPalette';

export class PingCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'ping',
      aliases: ['pong'],
      description: "Gets the bot's latency"
    });
  }

  public override registerApplicationCommands(
    registry: ChatInputCommand.Registry
  ) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  public async chatInputRun(interaction: ChatInputCommand.Interaction) {
    const reply = await interaction.deferReply({
      fetchReply: true
    });

    const BotLatency = Math.round(this.container.client.ws.ping);
    const APILatency = reply.createdTimestamp - interaction.createdTimestamp;

    const embed = new EmbedBuilder()
      .setColor(ColorPalette.Default)
      .setTitle('Pong!')
      .setDescription(
        `Bot Latency: ${BotLatency} ms\nAPI Latency: ${APILatency} ms`
      );

    interaction.editReply({
      embeds: [embed]
    });
  }
}
