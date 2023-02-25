import { AudioResource } from '@discordjs/voice';
import { MusicResourceMetadata } from '../../interfaces/Music/MusicResourceMetadata';
import { getAudioPlayer } from './getAudioPlayer';

type MusicResourceType = MusicResourceMetadata['type'];

/**
 * Gets the music type of the track currently playing in a guild.
 * @param guildId The id of the guild to get the type of the resource that is currently playing for.
 * @returns The type of the resource that is currently playing.
 * @returns undefined if there is no resource playing.
 */
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
