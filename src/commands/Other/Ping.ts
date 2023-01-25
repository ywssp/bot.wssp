import { ChatInputCommand, Command } from '@sapphire/framework';
import type { Message } from 'discord.js';

export class PingCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'ping',
      aliases: ['pong'],
      description: 'ping pong'
    });
  }

  public async messageRun(message: Message) {
    const msg = await message.channel.send('Loading...');

    const BotLatency = Math.round(this.container.client.ws.ping);
    const APILatency = msg.createdTimestamp - message.createdTimestamp;

    msg.edit(
      `Pong!\nBot Latency ${BotLatency} ms.\nAPI Latency ${APILatency} ms.`
    );
  }

  public async chatInputRun(interaction: ChatInputCommand.Interaction) {
    const reply = await interaction.reply({
      content: 'Loading...',
      fetchReply: true
    });

    const BotLatency = Math.round(this.container.client.ws.ping);
    const APILatency = reply.createdTimestamp - interaction.createdTimestamp;

    interaction.editReply(
      `Pong!\nBot Latency ${BotLatency} ms.\nAPI Latency ${APILatency} ms.`
    );
  }
}
