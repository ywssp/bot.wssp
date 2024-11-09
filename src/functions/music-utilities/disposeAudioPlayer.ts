'use strict';

import { getVoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { getAudioPlayer } from './getAudioPlayer';

export function disposeAudioPlayer(guildId: string): void {
  const audioPlayer = getAudioPlayer(guildId);

  if (audioPlayer === undefined) {
    return;
  }

  audioPlayer.removeAllListeners();
  audioPlayer.stop(true);

  const voiceConnection = getVoiceConnection(guildId);

  if (
    voiceConnection !== undefined &&
    (voiceConnection.state.status === VoiceConnectionStatus.Connecting ||
      voiceConnection.state.status === VoiceConnectionStatus.Ready ||
      voiceConnection.state.status === VoiceConnectionStatus.Signalling)
  ) {
    voiceConnection.state.subscription?.unsubscribe();
  }
}
