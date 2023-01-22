import { AudioResource } from '@discordjs/voice';
import { QueuedYTVideoInfo } from '../../interfaces/YTVideoInfo';
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
    | QueuedYTVideoInfo
    | {
        type: 'radio';
        title: 'LISTEN.moe Radio';
        url: string;
      }
  >;

  switch (resource.metadata.type) {
    case 'youtube':
      return 'youtube';
    case 'radio':
      return 'radio';
    default:
      return undefined;
  }
}
