import { container } from '@sapphire/framework';
import * as playdl from 'play-dl';
import * as YTMusicAPI from 'ytmusic-api';
const ytmusic = new YTMusicAPI.default();
ytmusic.initialize();
import {
  TrackInfo,
  CachedTrackInfo
} from '../../../../interfaces/Music/Queue System/TrackInfo';
import { YTMusicTrackNaming } from '../../../../settings/TrackNaming';
import { TrackCacheResult } from '../../../../interfaces/Music/Queue System/TrackCacheResult';

function storeYTMusicTrackInCache(track: TrackInfo) {
  container.caches.ytMusicTracks.set(
    track.id,
    new CachedTrackInfo(track, new Date())
  );
}

async function fetchYTMusicTrackFromCache(
  videoId: string
): Promise<TrackCacheResult> {
  let track: TrackInfo;
  let cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };

  if (container.caches.ytMusicTracks.has(videoId)) {
    const fetchedTrack = container.caches.ytMusicTracks.get(
      videoId
    ) as CachedTrackInfo;

    cacheData = {
      status: 'hit',
      cachedAt: fetchedTrack.cachedAt
    };

    track = new TrackInfo(fetchedTrack);
  } else {
    let fetchedTrack: YTMusicAPI.SongDetailed;

    try {
      const initialVideo = await ytmusic.getSong(videoId);

      // Non-song videos will not have a formats property
      if (initialVideo.formats.length === 0) {
        throw new Error(
          `No track information found for ${YTMusicTrackNaming.fullIdentifier} ID: ${videoId}`
        );
      }

      // Check if there are audio versions of the video
      const search = await ytmusic.searchSongs(
        initialVideo.name + ' ' + initialVideo.artist.name
      );

      if (search.length === 0) {
        throw new Error(
          `No track information found for ${YTMusicTrackNaming.fullIdentifier} ID: ${videoId}`
        );
      }

      fetchedTrack = search[0];
    } catch (error) {
      throw new Error(
        `Could not fetch track information for ${YTMusicTrackNaming.fullIdentifier} ID: ${videoId}`
      );
    }

    track = new TrackInfo(fetchedTrack);
    storeYTMusicTrackInCache(track);

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

export async function searchYTMusic(
  linkOrSearch: string,
  options?: {
    limit?: number;
    forceSearch?: boolean;
  }
): Promise<TrackCacheResult | TrackInfo[]> {
  if (
    playdl.yt_validate(linkOrSearch) === 'video' &&
    linkOrSearch.startsWith('https') &&
    !options?.forceSearch
  ) {
    const id = new URL(linkOrSearch).searchParams.get('v') as string;

    let video: TrackCacheResult;

    try {
      video = await fetchYTMusicTrackFromCache(id);
    } catch (error: unknown) {
      // Possible error messages are already handled in fetchYTMusicTrackFromCache
      throw new Error((error as Error).message);
    }

    return video;
  }

  let searchResults: YTMusicAPI.SongDetailed[];

  try {
    searchResults = await ytmusic.searchSongs(linkOrSearch);
  } catch (error) {
    throw new Error(
      `An error occurred while searching for ${YTMusicTrackNaming.trackIdentifier}s.`
    );
  }

  if (searchResults.length === 0) {
    throw new Error(`No ${YTMusicTrackNaming.trackIdentifier}s found.`);
  }

  if (options?.limit) {
    searchResults = searchResults.slice(0, options.limit);
  }

  return searchResults.map((item) => new TrackInfo(item));
}
