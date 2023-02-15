import { container } from '@sapphire/framework';
import { video_basic_info } from 'play-dl';
import { TrackInfo, CachedTrackInfo } from '../../../interfaces/TrackInfo';

export type TrackCacheResult = {
  data: TrackInfo;
  cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };
};

export async function getTrackFromCache(
  trackId: string
): Promise<TrackCacheResult> {
  let track: TrackInfo;
  let cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };

  if (container.caches.tracks.has(trackId)) {
    const fetchedTrack = container.caches.tracks.get(
      trackId
    ) as CachedTrackInfo;
    cacheData = {
      status: 'hit',
      cachedAt: fetchedTrack.cachedAt
    };
    track = new TrackInfo(fetchedTrack);
  } else {
    try {
      cacheData = {
        status: 'miss',
        cachedAt: new Date()
      };
      track = new TrackInfo(
        await (
          await video_basic_info(trackId)
        ).video_details
      );

      container.caches.tracks.set(
        trackId,
        new CachedTrackInfo(track, cacheData.cachedAt)
      );
    } catch (error) {
      console.error(error);
      throw new Error(
        `Could not fetch track information for track ID: ${trackId}`
      );
    }
  }

  return {
    data: track,
    cacheData
  };
}
