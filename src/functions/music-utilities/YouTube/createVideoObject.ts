import { User } from 'discord.js';
import { Duration } from 'luxon';
import type { videoInfo } from 'ytdl-core';
import { SimpleVideoInfo } from '../../../interfaces/SimpleVideoInfo';

export function createVideoObject(
  { videoDetails }: videoInfo,
  user: User
): SimpleVideoInfo {
  return {
    type: 'youtube',
    title: videoDetails.title,
    url: videoDetails.video_url,
    id: videoDetails.videoId,
    channel: {
      name: videoDetails.author.name,
      url: videoDetails.author.channel_url
    },
    duration: videoDetails.isLiveContent
      ? 'Live Stream'
      : Duration.fromMillis(Number(videoDetails.lengthSeconds) * 1000),
    thumbnail: videoDetails.thumbnails.pop()?.url,
    requester: user.tag
  };
}
