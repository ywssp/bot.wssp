'use strict';

import { AudioPlayer, getVoiceConnection } from '@discordjs/voice';

export function getAudioPlayer(guildId: string): AudioPlayer | undefined {
  const voiceConnection = getVoiceConnection(guildId);

  if (
    voiceConnection === undefined ||
    voiceConnection.state.status !== 'ready' ||
    voiceConnection.state.subscription === undefined
  ) {
    return undefined;
  }

  return voiceConnection.state.subscription.player;
}
