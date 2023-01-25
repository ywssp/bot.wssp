import { AudioResource } from '@discordjs/voice';
import { MusicResourceMetadata } from '../../interfaces/MusicResourceMetadata';
import { getAudioPlayer } from './getAudioPlayer';

export function getPlayingType(
  guildId: string
): 'youtube' | 'radio' | undefined {
  const audioPlayer = getAudioPlayer(guildId);

  if (audioPlayer === undefined) {
    return undefined;
  }

  if (
    audioPlayer.state.status !== 'playing' &&
    audioPlayer.state.status !== 'paused' &&
    audioPlayer.state.status !== 'buffering'
  ) {
    return undefined;
  }

  const resource = audioPlayer.state
    .resource as AudioResource<MusicResourceMetadata>;

  return resource.metadata.type;
}
