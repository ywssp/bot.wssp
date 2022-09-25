import { getVoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';

export function unsubscribeVoiceConnection(guildId: string) {
  const voiceConnection = getVoiceConnection(guildId);

  if (
    voiceConnection &&
    (voiceConnection.state.status === VoiceConnectionStatus.Connecting ||
      voiceConnection.state.status === VoiceConnectionStatus.Ready ||
      voiceConnection.state.status === VoiceConnectionStatus.Signalling)
  ) {
    voiceConnection.state.subscription?.unsubscribe();
  }

  return;
}
