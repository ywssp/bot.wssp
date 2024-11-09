'use strict';

export interface MusicSourceTerms {
  source: string;
  fullIdentifier: string;
  trackIdentifier: string;
  creator: string;
  album: string;
}

export const YouTubeTerms: MusicSourceTerms = {
  source: 'YouTube',
  fullIdentifier: 'YouTube Video',
  trackIdentifier: 'video',
  creator: 'Uploader',
  album: 'Album'
};

export const SoundCloudTerms: MusicSourceTerms = {
  source: 'SoundCloud',
  fullIdentifier: 'SoundCloud Track',
  trackIdentifier: 'track',
  creator: 'Artist',
  album: 'Album'
};

export const YTMusicTerms: MusicSourceTerms = {
  source: 'YT Music',
  fullIdentifier: 'YT Music Track',
  trackIdentifier: 'track',
  creator: 'Artist',
  album: 'Album'
};

export const SpotifyTerms: MusicSourceTerms = {
  source: 'Spotify',
  fullIdentifier: 'Spotify Track',
  trackIdentifier: 'track',
  creator: 'Artist',
  album: 'Album'
};
