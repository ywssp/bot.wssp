'use strict';

import { container } from '@sapphire/framework';

import * as playdl from 'play-dl';

import { Duration } from 'luxon';

import { AdaptedTrackCacheResult } from '../../../../interfaces/Music/Queue System/TrackCacheResult';
import {
  AdaptedTrackInfo,
  CachedAdaptedTrackInfo,
  TrackInfo
} from '../../../../interfaces/Music/Queue System/TrackInfo';
import { SpotifyTerms } from '../../../../settings/MusicSourceTerms';
import {
  songMatchPoints,
  SpotifySearchSettings
} from '../../../../settings/SpotifySearchSettings';
import { searchYTMusic } from './youtubeMusic';

function createSearchQueryFromTrack(track: TrackInfo): string {
  const trackArtists = track.artist.map((artist) => artist.name).join(', ');

  return `${track.title}${trackArtists ? ` by ${trackArtists.trim()}` : ''}`;
}

function matchDuration(
  spotifyTrack: TrackInfo,
  youtubeTrack: TrackInfo
): boolean {
  const spDuration = spotifyTrack.duration as Duration;
  const ytDuration = youtubeTrack.duration as Duration;

  const durationDifference = Math.abs(
    spDuration.minus(ytDuration).as('seconds')
  );

  return durationDifference <= SpotifySearchSettings.durationDeviation;
}

type detailMatch = 'none' | 'includes' | 'equals';

function matchTitle(
  spotifyTrack: TrackInfo,
  youtubeTrack: TrackInfo
): detailMatch {
  const spTitle = spotifyTrack.title.toLowerCase();
  const ytTitle = youtubeTrack.title.toLowerCase();

  if (ytTitle === spTitle) {
    return 'equals';
  }

  return ytTitle.includes(spTitle) || spTitle.includes(ytTitle)
    ? 'includes'
    : 'none';
}

function matchArtists(
  spotifyTrack: TrackInfo,
  youtubeTrack: TrackInfo
): boolean {
  const spotifyArtists = spotifyTrack.artist.map((artist) =>
    artist.name.toLowerCase()
  );
  const youtubeArtists = youtubeTrack.artist.map((artist) =>
    artist.name.toLowerCase()
  );

  for (const ytArtist of youtubeArtists) {
    for (const spArtist of spotifyArtists) {
      if (
        ytArtist === spArtist ||
        ytArtist.includes(spArtist) ||
        spArtist.includes(ytArtist)
      ) {
        return true;
      }
    }
  }

  return false;
}

function matchAlbum(
  spotifyTrack: TrackInfo,
  youtubeTrack: TrackInfo
): detailMatch {
  const spotifyAlbum = spotifyTrack.album?.name.toLowerCase() ?? '';
  const youtubeAlbum = youtubeTrack.album?.name.toLowerCase() ?? '';

  if (!spotifyAlbum || !youtubeAlbum) {
    return 'none';
  }

  if (spotifyAlbum === youtubeAlbum) {
    return 'equals';
  }

  return youtubeAlbum.includes(spotifyAlbum) ||
    spotifyAlbum.includes(youtubeAlbum)
    ? 'includes'
    : 'none';
}

function formatTrackToConsole(track: TrackInfo) {
  let str = '';

  str += `Title:\t${track.title}\n`;
  str += `Artist:\t${track.artist.map((artist) => artist.name)}\n`;
  str += `Album:\t${track.album?.name}\n`;
  str += `Duration:\t${(track.duration as Duration).toFormat('mm:ss')}\n`;

  return str;
}

export async function matchYTMusicToSpotify(
  spotifyTrack: TrackInfo
): Promise<TrackInfo | null> {
  const searchQuery = createSearchQueryFromTrack(spotifyTrack);

  const ytMusicTracks = (await searchYTMusic(searchQuery, {
    limit: 10
  })) as TrackInfo[];

  const matchPoints: number[] = [];

  const weights = SpotifySearchSettings.matchWeights;

  if (SpotifySearchSettings.debugMatch) {
    container.logger.info('========================');
    container.logger.info(
      `Matching Spotify track to YouTube Music tracks...\n`
    );

    container.logger.info(formatTrackToConsole(spotifyTrack));

    container.logger.info(`\nSearch query used: ${searchQuery}`);
    container.logger.info('Displaying songs with matches');
  }

  for (let i = 0; i < ytMusicTracks.length; i++) {
    const ytMusicTrack = ytMusicTracks[i];

    const titleMatch = matchTitle(spotifyTrack, ytMusicTrack);
    const artistMatch = matchArtists(spotifyTrack, ytMusicTrack);
    const albumMatch =
      spotifyTrack.album && matchAlbum(spotifyTrack, ytMusicTrack);
    const durationMatch = matchDuration(spotifyTrack, ytMusicTrack);

    const currentPoints: songMatchPoints = {
      title: titleMatch !== 'none' ? weights.title : 0,
      titleEquals: titleMatch === 'equals' ? weights.titleEquals : 0,
      artists: artistMatch ? weights.artists : 0,
      album: albumMatch !== 'none' ? weights.album : 0,
      albumEquals: albumMatch === 'equals' ? weights.albumEquals : 0,
      duration: durationMatch ? weights.duration : 0
    };

    const totalPoints = Object.values(currentPoints).reduce(
      (acc, curr) => acc + curr
    );

    matchPoints[i] = totalPoints;

    // Match debug
    if (SpotifySearchSettings.debugMatch && totalPoints > 0) {
      container.logger.info('------------------------');

      container.logger.info(formatTrackToConsole(ytMusicTrack));

      const matchPointsString = Object.entries(currentPoints)
        .filter(([, value]) => value > 0)
        .map(([key]) => key)
        .join(', ');

      container.logger.info('Matched: ' + matchPointsString);
      container.logger.info('Total points: ' + totalPoints);
    }
  }

  const highestMatchIndex = Math.max(...matchPoints);
  return ytMusicTracks[matchPoints.indexOf(highestMatchIndex)];
}

export function storeSpotifyTrackInCache(track: AdaptedTrackInfo) {
  if (track.source === 'spotify') {
    container.caches.spotifyTracks.set(
      track.id,
      new CachedAdaptedTrackInfo(track, new Date())
    );
  }
}

async function fetchSpotifyTrackFromCache(
  trackURL: string
): Promise<AdaptedTrackCacheResult> {
  let track: AdaptedTrackInfo;
  let cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };

  const id = new URL(trackURL).pathname.split('/').pop();

  if (id && container.caches.spotifyTracks.has(id)) {
    const fetchedTrack = container.caches.spotifyTracks.get(
      id
    ) as CachedAdaptedTrackInfo;

    cacheData = {
      status: 'hit',
      cachedAt: fetchedTrack.cachedAt
    };

    track = new AdaptedTrackInfo(fetchedTrack);
  } else {
    let fetchedTrack: playdl.SpotifyTrack;

    try {
      if (playdl.is_expired()) {
        await playdl.refreshToken();
      }

      const searchResult = await playdl.spotify(trackURL);

      if (searchResult.type !== 'track') {
        throw new Error();
      }

      fetchedTrack = searchResult as playdl.SpotifyTrack;
    } catch {
      throw new Error(
        `Could not fetch information for ${SpotifyTerms.fullTrackTerm} ID: ${trackURL}`
      );
    }

    const baseTrack = new TrackInfo(fetchedTrack);
    let matchedTrack: TrackInfo;

    try {
      const searchedTrack = await matchYTMusicToSpotify(baseTrack);

      if (!searchedTrack) {
        throw new Error();
      }

      matchedTrack = searchedTrack;
    } catch {
      throw new Error(
        `Could not find a suitable match for ${SpotifyTerms.fullTrackTerm} ID: ${trackURL}`
      );
    }

    track = new AdaptedTrackInfo({
      track: baseTrack,
      matchedTrack
    });

    storeSpotifyTrackInCache(track);

    cacheData = {
      status: 'miss',
      cachedAt: new Date()
    };
  }

  return {
    data: track,
    cacheData
  };
}

export async function searchSpotifyAdapt(
  linkOrSearch: string,
  options?: {
    limit?: number;
    forceSearch?: boolean;
    source?: 'youtube' | 'soundcloud';
  }
): Promise<AdaptedTrackCacheResult | AdaptedTrackInfo[]> {
  if (playdl.sp_validate(linkOrSearch) === 'track' && !options?.forceSearch) {
    const url = linkOrSearch;

    let track: AdaptedTrackCacheResult;

    try {
      track = await fetchSpotifyTrackFromCache(url);
    } catch {
      throw new Error(
        `Could not fetch information for ${SpotifyTerms.fullTrackTerm} ID: ${url}`
      );
    }

    return track;
  }

  const limit = options?.limit ?? 1;

  let searchResults: playdl.SpotifyTrack[];

  try {
    if (playdl.is_expired()) {
      await playdl.refreshToken();
    }

    searchResults = await playdl.search(linkOrSearch, {
      limit,
      source: {
        spotify: 'track'
      }
    });
  } catch {
    throw new Error(
      `An error occurred while searching for ${SpotifyTerms.trackTerm}s.`
    );
  }

  if (searchResults.length === 0) {
    throw new Error(`No ${SpotifyTerms.trackTerm}s found.`);
  }

  const adaptedSearchResults: AdaptedTrackInfo[] = [];

  for (const searchResult of searchResults) {
    const matchedTrack = await matchYTMusicToSpotify(
      new TrackInfo(searchResult)
    );

    if (!matchedTrack) {
      continue;
    }

    adaptedSearchResults.push(
      new AdaptedTrackInfo({
        track: new TrackInfo(searchResult),
        matchedTrack
      })
    );
  }

  return adaptedSearchResults;
}
