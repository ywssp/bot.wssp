import { TrackInfo } from './TrackInfo';

export type TrackCacheResult = {
  data: TrackInfo;
  cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };
};
