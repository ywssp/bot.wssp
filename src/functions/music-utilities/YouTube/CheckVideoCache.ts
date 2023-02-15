import { container } from '@sapphire/framework';
import { video_basic_info } from 'play-dl';
import { SimpleTrack, CachedTrack } from '../../../interfaces/YTVideoInfo';

export type VideoCacheResult = {
  data: SimpleTrack;
  cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };
};

export async function checkVideoCache(
  videoId: string
): Promise<VideoCacheResult> {
  let video: SimpleTrack;
  let cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };

  if (container.caches.videos.has(videoId)) {
    const fetchedVideo = container.caches.videos.get(videoId) as CachedTrack;
    cacheData = {
      status: 'hit',
      cachedAt: fetchedVideo.cachedAt
    };
    video = new SimpleTrack(fetchedVideo);
  } else {
    try {
      cacheData = {
        status: 'miss',
        cachedAt: new Date()
      };
      video = new SimpleTrack(
        await (
          await video_basic_info(videoId)
        ).video_details
      );

      container.caches.videos.set(
        videoId,
        new CachedTrack(video, cacheData.cachedAt)
      );
    } catch (error) {
      console.error(error);
      throw new Error(
        `Could not fetch video information for video ID: ${videoId}`
      );
    }
  }

  return {
    data: video,
    cacheData
  };
}
