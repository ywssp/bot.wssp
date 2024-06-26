import { container } from '@sapphire/framework';
import * as playdl from 'play-dl';
import {
  TrackInfo,
  CachedTrackInfo
} from '../../../../interfaces/Music/Queue System/TrackInfo';
import { SpotifyTrackNaming } from '../../../../settings/TrackNaming';
import { TrackCacheResult } from '../../../../interfaces/Music/Queue System/TrackCacheResult';

export function storeSpotifyTrackInCache(track: TrackInfo) {
  if (track.source === 'spotify') {
    container.caches.spotifyTracks.set(
      track.id,
      new CachedTrackInfo(track, new Date())
    );
  }
}

async function fetchSpotifyTrackFromCache(
  trackURL: string
): Promise<TrackCacheResult> {
  let track: TrackInfo;
  let cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };

  const id = new URL(trackURL).pathname.split('/').pop();

  if (id && container.caches.spotifyTracks.has(id)) {
    const fetchedTrack = container.caches.spotifyTracks.get(
      id
    ) as CachedTrackInfo;

    cacheData = {
      status: 'hit',
      cachedAt: fetchedTrack.cachedAt
    };

    track = new TrackInfo(fetchedTrack);
  } else {
    let fetchedTrack: playdl.SpotifyTrack;

    try {
      if (playdl.is_expired()) {
        await playdl.refreshToken();
      }

      const searchResult = await playdl.search(trackURL, {
        limit: 1,
        source: {
          spotify: 'track'
        }
      });

      if (searchResult.length === 0) {
        throw new Error();
      }

      fetchedTrack = searchResult[0];
    } catch (error) {
      throw new Error(
        `Could not fetch information for ${SpotifyTrackNaming.fullIdentifier} ID: ${trackURL}`
      );
    }

    track = new TrackInfo(fetchedTrack);
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
): Promise<TrackCacheResult | TrackInfo[]> {
  if (
    (await playdl.so_validate(linkOrSearch)) === 'track' &&
    !options?.forceSearch
  ) {
    const url = linkOrSearch;

    let track: TrackCacheResult;

    try {
      track = await fetchSpotifyTrackFromCache(url);
    } catch (error) {
      throw new Error(
        `Could not fetch information for ${SpotifyTrackNaming.fullIdentifier} ID: ${url}`
      );
    }

    return track;
  }

  const limit = options?.limit ?? 1;

  let searchResults: playdl.SpotifyTrack[];

  try {
    searchResults = await playdl.search(linkOrSearch, {
      limit,
      source: {
        spotify: 'track'
      }
    });
  } catch (error) {
    throw new Error(
      `An error occurred while searching for ${SpotifyTrackNaming.trackIdentifier}s.`
    );
  }

  if (searchResults.length === 0) {
    throw new Error(`No ${SpotifyTrackNaming.trackIdentifier}s found.`);
  }

  return searchResults.map((item) => new TrackInfo(item));
}
