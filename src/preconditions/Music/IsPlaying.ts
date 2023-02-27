import { getVoiceConnection } from '@discordjs/voice';
import { ChatInputCommand, Precondition } from '@sapphire/framework';

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
      return this.error({ message: 'There is no video playing!' });
    }

    return this.ok();
  }
}
