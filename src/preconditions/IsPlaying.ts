import { getVoiceConnection } from '@discordjs/voice';
import { ChatInputCommand, Precondition } from '@sapphire/framework';
import type { Message } from 'discord.js';

export class IsPlayingPrecondition extends Precondition {
  public override messageRun(message: Message) {
    return this.check(message.guildId);
  }

  public override chatInputRun(interaction: ChatInputCommand.Interaction) {
    return this.check(interaction.guildId);
  }

  private check(guildId: string | null) {
    if (guildId === null) {
      return this.error({
        message: 'The command can only be run inside a server!'
      });
    }

    const voiceConnection = getVoiceConnection(guildId);

    if (voiceConnection === null) {
      return this.error({ message: 'There is no video playing!' });
    }

    return this.ok();
  }
}
