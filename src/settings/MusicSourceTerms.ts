'use strict';

export interface MusicSourceTerms {
  source: string;
  fullTrackTerm: string;
  trackTerm: string;
  creator: string;
  album: string;
}

export const YouTubeTerms: MusicSourceTerms = {
  source: 'YouTube',
  fullTrackTerm: 'YouTube Video',
  trackTerm: 'video',
  creator: 'Uploader',
  album: 'Album'
};

export const SoundCloudTerms: MusicSourceTerms = {
  source: 'SoundCloud',
  fullTrackTerm: 'SoundCloud Track',
  trackTerm: 'track',
  creator: 'Artist',
  album: 'Album'
};

export const YTMusicTerms: MusicSourceTerms = {
  source: 'YT Music',
  fullTrackTerm: 'YT Music Track',
  trackTerm: 'track',
  creator: 'Artist',
  album: 'Album'
};

export const SpotifyTerms: MusicSourceTerms = {
  source: 'Spotify',
  fullTrackTerm: 'Spotify Track',
  trackTerm: 'track',
  creator: 'Artist',
  album: 'Album'
};
