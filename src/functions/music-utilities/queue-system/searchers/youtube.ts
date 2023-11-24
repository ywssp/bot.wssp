import { container } from '@sapphire/framework';
import * as playdl from 'play-dl';
import {
  TrackInfo,
  CachedTrackInfo
} from '../../../../interfaces/Music/GuildMusicData/Queue System/TrackInfo';
import { YouTubeVideoNaming } from '../../../../settings/TrackNaming';
import { TrackCacheResult } from '../../../../interfaces/Music/GuildMusicData/Queue System/TrackCacheResult';

function storeYoutubeTrackInCache(track: TrackInfo) {
  container.caches.youtubeTracks.set(
    track.id,
    new CachedTrackInfo(track, new Date())
  );
}

async function fetchYoutubeTrackFromCache(
  trackURL: string
): Promise<TrackCacheResult> {
  let track: TrackInfo;
  let cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };

  if (container.caches.youtubeTracks.has(trackURL)) {
    const fetchedTrack = container.caches.youtubeTracks.get(
      trackURL
    ) as CachedTrackInfo;

    cacheData = {
      status: 'hit',
      cachedAt: fetchedTrack.cachedAt
    };

    track = new TrackInfo(fetchedTrack);
  } else {
    let fetchedTrack: playdl.YouTubeVideo;

    try {
      fetchedTrack = (await playdl.video_basic_info(trackURL)).video_details;
    } catch (error) {
      throw new Error(
        `Could not fetch track information for ${YouTubeVideoNaming.fullIdentifier} ID: ${trackURL}`
      );
    }

    track = new TrackInfo(fetchedTrack);
    storeYoutubeTrackInCache(track);

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

export async function searchYoutube(
  linkOrSearch: string,
  options?: {
    limit?: number;
    forceSearch?: boolean;
  }
): Promise<TrackCacheResult | TrackInfo[]> {
  if (
    playdl.yt_validate(linkOrSearch) === 'video' &&
    linkOrSearch.startsWith('https')
  ) {
    const id = new URL(linkOrSearch).searchParams.get('v') as string;

    let video: TrackCacheResult;

    try {
      video = await fetchYoutubeTrackFromCache(id);
    } catch (error) {
      throw new Error(
        `Could not fetch information for ${YouTubeVideoNaming.fullIdentifier} ID: ${id}`
      );
    }

    return video;
  }

  const limit = options?.limit ?? 1;

  let searchResults: playdl.YouTubeVideo[];

  try {
    searchResults = await playdl.search(linkOrSearch, {
      limit,
      source: {
        youtube: 'video'
      }
    });
  } catch (error) {
    throw new Error(
      `An error occurred while searching for ${YouTubeVideoNaming.trackIdentifier}s.`
    );
  }

  if (searchResults.length === 0) {
    throw new Error(`No ${YouTubeVideoNaming.trackIdentifier}s found.`);
  }

  return searchResults.map((item) => new TrackInfo(item));
}
