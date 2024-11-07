'use strict';

import { container } from '@sapphire/framework';
import * as playdl from 'play-dl';
import {
  TrackInfo,
  AdaptedTrackInfo,
  CachedAdaptedTrackInfo
} from '../../../../interfaces/Music/Queue System/TrackInfo';
import { SpotifyTrackNaming } from '../../../../settings/TrackNaming';
import {
  AdaptedTrackCacheResult,
  TrackCacheResult
} from '../../../../interfaces/Music/Queue System/TrackCacheResult';
import { SpotifySearchSettings } from '../../../../settings/SpotifySearchSettings';
import { Duration } from 'luxon';
import { searchYTMusic } from './youtubeMusic';

function createSearchQueryFromTrack(track: TrackInfo): string {
  let trackArtists = '';

  track.artist.forEach((artist) => {
    trackArtists += artist.name + ' ';
  });

  return `${track.title}${trackArtists ? ` by ${trackArtists.trim()}` : ''}`;
}

function hasSimilarDuration(
  durationSpotify: Duration,
  durationYoutube: Duration
): boolean {
  const durationDifference = Math.abs(
    durationSpotify.minus(durationYoutube).as('seconds')
  );

  return durationDifference <= SpotifySearchSettings.lengthDeviation;
}

function channelContainsArtistName(
  spotifyArtists: string[],
  youtubeArtist: string
): boolean {
  for (const artist of spotifyArtists) {
    if (youtubeArtist.includes(artist)) {
      return true;
    }
  }

  return false;
}

async function getClosestYouTubeSearchResultToSpotifyTrack(
  spotifyTrack: TrackInfo
): Promise<TrackInfo | null> {
  const searchQuery = createSearchQueryFromTrack(spotifyTrack);

  const ytMusicTracks = (await searchYTMusic(searchQuery, {
    limit: 10
  })) as TrackInfo[];

  return (
    ytMusicTracks.find(
      (ytMusicTrack) =>
        (hasSimilarDuration(
          spotifyTrack.duration as Duration,
          ytMusicTrack.duration as Duration
        ) &&
          channelContainsArtistName(
            spotifyTrack.artist.map((artist) => artist.name),
            ytMusicTrack.artist[0].name as string
          )) ||
        hasSimilarDuration(
          spotifyTrack.duration as Duration,
          ytMusicTrack.duration as Duration
        ) ||
        null
    ) ?? null
  );
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
        `Could not fetch information for ${SpotifyTrackNaming.fullIdentifier} ID: ${trackURL}`
      );
    }

    const baseTrack = new TrackInfo(fetchedTrack);
    let matchedTrack: TrackInfo;

    try {
      const searchedTrack = await getClosestYouTubeSearchResultToSpotifyTrack(
        baseTrack
      );

      if (!searchedTrack) {
        throw new Error();
      }

      matchedTrack = searchedTrack;
    } catch {
      throw new Error(
        `Could not find a suitable match for ${SpotifyTrackNaming.fullIdentifier} ID: ${trackURL}`
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

export async function searchSpotify(
  linkOrSearch: string,
  options?: {
    limit?: number;
    forceSearch?: boolean;
    source?: 'youtube' | 'soundcloud';
  }
): Promise<TrackCacheResult | AdaptedTrackInfo[]> {
  if (playdl.sp_validate(linkOrSearch) === 'track' && !options?.forceSearch) {
    const url = linkOrSearch;

    let track: TrackCacheResult;

    try {
      track = await fetchSpotifyTrackFromCache(url);
    } catch {
      throw new Error(
        `Could not fetch information for ${SpotifyTrackNaming.fullIdentifier} ID: ${url}`
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
      `An error occurred while searching for ${SpotifyTrackNaming.trackIdentifier}s.`
    );
  }

  if (searchResults.length === 0) {
    throw new Error(`No ${SpotifyTrackNaming.trackIdentifier}s found.`);
  }

  const adaptedSearchResults: AdaptedTrackInfo[] = [];

  for (const searchResult of searchResults) {
    const matchedTrack = await getClosestYouTubeSearchResultToSpotifyTrack(
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
