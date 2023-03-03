import { TrackInfo } from '../../../interfaces/Music/Queue System/TrackInfo';
import {
  YouTubeVideoNaming,
  SoundCloudTrackNaming,
  TrackNamings
} from '../../../settings/TrackNaming';

export function getTrackNamings(track: TrackInfo): TrackNamings {
  if (track.source === 'youtube') {
    return YouTubeVideoNaming;
  }

  return SoundCloudTrackNaming;
}
