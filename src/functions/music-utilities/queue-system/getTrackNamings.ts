'use strict';

import { TrackInfo } from '../../../interfaces/Music/Queue System/TrackInfo';
import {
  YouTubeTerms,
  SoundCloudTerms,
  YTMusicTerms,
  MusicSourceTerms,
  SpotifyTerms
} from '../../../settings/MusicSourceTerms';

export function getTrackNamings(track: TrackInfo): MusicSourceTerms {
  if (track.source === 'youtube') {
    return YouTubeTerms;
  } else if (track.source === 'soundcloud') {
    return SoundCloudTerms;
  } else if (track.source === 'youtube_music') {
    return YTMusicTerms;
  } else if (track.source === 'spotify') {
    return SpotifyTerms;
  }

  throw new Error('Unknown track source');
}
