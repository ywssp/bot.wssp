'use strict';

import { ChatInputCommand, Precondition } from '@sapphire/framework';

export class HasGuildMusicDataPrecondition extends Precondition {
  public override chatInputRun(interaction: ChatInputCommand.Interaction) {
    return this.check(interaction.guildId);
  }

  private check(guildId: string | null) {
    if (guildId === null) {
      return this.error({
        message: 'The command can only be run inside a server!'
      });
    }

    if (this.container.guildMusicDataMap.has(guildId) === false) {
      return this.error({ message: 'There is nothing playing!' });
    }

    return this.ok();
  }
}
