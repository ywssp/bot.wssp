import { AudioResource } from '@discordjs/voice';
import { MusicResourceMetadata } from '../../interfaces/Music/MusicResourceMetadata';
import { getAudioPlayer } from './getAudioPlayer';

type MusicResourceType = MusicResourceMetadata['type'];

export function getPlayingType(guildId: string): MusicResourceType | undefined {
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
