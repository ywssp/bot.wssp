export interface TrackNamings {
  source: string;
  fullIdentifier: string;
  trackIdentifier: string;
  creator: string;
  album: string;
}

export const YouTubeVideoNaming: TrackNamings = {
  source: 'YouTube',
  fullIdentifier: 'YouTube Video',
  trackIdentifier: 'video',
  creator: 'Uploader',
  album: 'Album'
};

export const SoundCloudTrackNaming: TrackNamings = {
  source: 'SoundCloud',
  fullIdentifier: 'SoundCloud Track',
  trackIdentifier: 'track',
  creator: 'Artist',
  album: 'Album'
};

export const YTMusicTrackNaming: TrackNamings = {
  source: 'YT Music',
  fullIdentifier: 'YT Music Track',
  trackIdentifier: 'track',
  creator: 'Artist',
  album: 'Album'
};

export const SpotifyTrackNaming: TrackNamings = {
  source: 'Spotify',
  fullIdentifier: 'Spotify Track',
  trackIdentifier: 'track',
  creator: 'Artist',
  album: 'Album'
};
