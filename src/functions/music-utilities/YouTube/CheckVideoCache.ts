import { container } from '@sapphire/framework';

import { getBasicInfo } from 'ytdl-core';
import {
  SimpleYTVideoInfo,
  CachedYTVideoInfo
} from '../../../interfaces/YTVideoInfo';

export type VideoCacheResult = {
  data: SimpleYTVideoInfo;
  cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };
};

export async function checkVideoCache(
  videoId: string
): Promise<VideoCacheResult> {
  let video: SimpleYTVideoInfo;
  let cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };

  if (container.caches.videos.has(videoId)) {
    const fetchedVideo = container.caches.videos.get(
      videoId
    ) as CachedYTVideoInfo;
    cacheData = {
      status: 'hit',
      cachedAt: fetchedVideo.cachedAt
    };
    video = new SimpleYTVideoInfo(fetchedVideo);
  } else {
    // TODO: Add a try catch here to catch errors when the video is not found
    cacheData = {
      status: 'miss',
      cachedAt: new Date()
    };
    video = new SimpleYTVideoInfo(await getBasicInfo(videoId));

    container.caches.videos.set(
      videoId,
      new CachedYTVideoInfo(video, cacheData.cachedAt)
    );
  }
  return {
    data: video,
    cacheData
  };
}
