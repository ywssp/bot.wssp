import { AudioPlayer, getVoiceConnection } from '@discordjs/voice';

export function getAudioPlayer(guildId: string): AudioPlayer | undefined {
  const voiceConnection = getVoiceConnection(guildId);
  if (
    voiceConnection === undefined ||
    voiceConnection.state.status !== 'ready'
  ) {
    return undefined;
  }
  const audioPlayer = voiceConnection.state.subscription?.player;

  return audioPlayer;
}
