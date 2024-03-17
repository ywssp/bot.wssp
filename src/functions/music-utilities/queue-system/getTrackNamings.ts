import { TrackInfo } from '../../../interfaces/Music/GuildMusicData/Queue System/TrackInfo';
import {
  YouTubeVideoNaming,
  SoundCloudTrackNaming,
  YTMusicTrackNaming,
  TrackNamings
} from '../../../settings/TrackNaming';

export function getTrackNamings(track: TrackInfo): TrackNamings {
  if (track.source === 'youtube') {
    return YouTubeVideoNaming;
  } else if (track.source === 'soundcloud') {
    return SoundCloudTrackNaming;
  }

  return YTMusicTrackNaming;
}
