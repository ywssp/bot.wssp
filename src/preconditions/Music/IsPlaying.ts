'use strict';

import { ChatInputCommand, Precondition } from '@sapphire/framework';
import { getVoiceConnection } from '@discordjs/voice';

export class IsPlayingPrecondition extends Precondition {
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

    if (
      voiceConnection === undefined ||
      voiceConnection.state.status !== 'ready'
    ) {
      return this.error({ message: 'There is no track playing!' });
    }

    return this.ok();
  }
}
