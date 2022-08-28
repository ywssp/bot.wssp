import { Precondition } from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';

export class OwnerOnlyPrecondition extends Precondition {
  public override messageRun(message: Message) {
    return this.checkOwner(message.author.id);
  }

  public override chatInputRun(interaction: CommandInteraction) {
    return this.checkOwner(interaction.user.id);
  }

  private checkOwner(userId: string) {
    if (process.env.OWNER?.split(',').includes(userId)) {
      return this.ok();
    }

    return this.error({ message: 'Only the bot owner can use this command!' });
  }
}
