import { TrackInfo } from '../../../interfaces/Music/Queue System/TrackInfo';
import {
  YouTubeVideoNaming,
  SoundCloudTrackNaming,
  YTMusicTrackNaming,
  TrackNamings,
  SpotifyTrackNaming
} from '../../../settings/TrackNaming';

export function getTrackNamings(track: TrackInfo): TrackNamings {
  if (track.source === 'youtube') {
    return YouTubeVideoNaming;
  } else if (track.source === 'soundcloud') {
    return SoundCloudTrackNaming;
  } else if (track.source === 'youtube_music') {
    return YTMusicTrackNaming;
  } else if (track.source === 'spotify') {
    return SpotifyTrackNaming;
  }

  throw new Error('Unknown track source');
}
