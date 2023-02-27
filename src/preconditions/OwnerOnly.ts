import { Precondition } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';

export class OwnerOnlyPrecondition extends Precondition {
  public override chatInputRun(interaction: CommandInteraction) {
    return this.checkOwner(interaction.user.id);
  }

  private checkOwner(userId: string) {
    const ownerUserIds =
      process.env.OWNER_USER_IDS?.split(',').map((id) => id.trim()) ?? [];

    if (ownerUserIds.includes(userId)) {
      return this.ok();
    }

    return this.error({ message: 'Only the bot owner can use this command!' });
  }
}
