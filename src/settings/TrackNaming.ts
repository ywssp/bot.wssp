export interface TrackNamings {
  source: string;
  fullIdentifier: string;
  trackIdentifier: string;
  creator: string;
}

export const YouTubeVideoNaming: TrackNamings = {
  source: 'YouTube',
  fullIdentifier: 'YouTube Video',
  trackIdentifier: 'video',
  creator: 'Uploader'
};

export const SoundCloudTrackNaming: TrackNamings = {
  source: 'SoundCloud',
  fullIdentifier: 'SoundCloud Track',
  trackIdentifier: 'track',
  creator: 'Artist'
};

export const YTMusicTrackNaming: TrackNamings = {
  source: 'YT Music',
  fullIdentifier: 'YT Music Track',
  trackIdentifier: 'track',
  creator: 'Artist'
};
