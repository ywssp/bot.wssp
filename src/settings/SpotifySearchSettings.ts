'use strict';

export type songMatchPoints = {
  title: number;
  titleEquals: number;
  artists: number;
  album: number;
  albumEquals: number;
  duration: number;
};

export const SpotifySearchSettings = {
  // How far the duration can be off in seconds
  durationDeviation: 5,

  // If the matching results should be logged
  debugMatch: false,

  // Points for weighing which track matches the best
  matchWeights: {
    // If title is part of the matching track
    title: 0,
    // If title is the same as the matching track
    titleEquals: 0,
    // If 1 spotify artist is part of the matching track
    artists: 1,
    // If album is part of the matching track
    album: 0,
    // If album is the same as the matching track
    albumEquals: 0,
    // If duration is near the matching track, uses durationDeviation
    duration: 1
  }
};
