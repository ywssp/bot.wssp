'use strict';

import { AdaptedTrackInfo, TrackInfo } from './TrackInfo';

export type TrackCacheResult = {
  data: TrackInfo;
  cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };
};

export type AdaptedTrackCacheResult = {
  data: AdaptedTrackInfo;
  cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };
};
