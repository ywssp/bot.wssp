import { AudioResource } from '@discordjs/voice';
import { SimpleVideoInfo } from '../../interfaces/SimpleVideoInfo';
import { getAudioPlayer } from './getAudioPlayer';

export function getPlayingType(
  guildId: string
): 'youtube' | 'radio' | undefined {
  const audioPlayer = getAudioPlayer(guildId);

  if (audioPlayer === undefined) {
    return undefined;
  }

  if (
    audioPlayer?.state.status !== 'playing' &&
    audioPlayer?.state.status !== 'paused' &&
    audioPlayer?.state.status !== 'buffering'
  ) {
    return undefined;
  }

  const resource = audioPlayer.state.resource as AudioResource<
    | SimpleVideoInfo
    | {
        type: 'radio';
        title: 'LISTEN.moe Radio';
        url: string;
      }
  >;

  if (resource === undefined) {
    return undefined;
  }

  if (resource.metadata.type === 'youtube') {
    return 'youtube';
  }

  if (resource.metadata.type === 'radio') {
    return 'radio';
  }

  return undefined;
}
