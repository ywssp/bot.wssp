import { container } from '@sapphire/framework';
import { User } from 'discord.js';

import { getBasicInfo } from 'ytdl-core';
import { SimpleYTVideoInfo } from '../../../interfaces/SimpleYTVideoInfo';

export async function checkVideoCache(
  videoId: string,
  user: User
): Promise<SimpleYTVideoInfo> {
  let video: SimpleYTVideoInfo;

  if (container.videoCache.has(videoId)) {
    video = container.videoCache.get(videoId) as SimpleYTVideoInfo;
  } else {
    // TODO: Add a try catch here to catch errors when the video is not found
    video = new SimpleYTVideoInfo(await getBasicInfo(videoId), user);
    container.videoCache.set(videoId, video);
  }
  return video;
}
