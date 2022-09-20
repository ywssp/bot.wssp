import { ChatInputCommand, Precondition } from '@sapphire/framework';
import type { Message } from 'discord.js';

import { getVoiceConnection } from '@discordjs/voice';

import { getPlayingType } from '../../functions/music-utilities/getPlayingType';

export class IsPlayingYoutubePrecondition extends Precondition {
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

    if (
      voiceConnection === undefined ||
      voiceConnection.state.status !== 'ready'
    ) {
      return this.error({ message: 'There is no video playing!' });
    }

    const playingType = getPlayingType(guildId);

    if (playingType !== 'youtube') {
      return this.error({
        message: 'The command can only be run when a YouTube video is playing!'
      });
    }

    return this.ok();
  }
}
