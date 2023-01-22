import { User } from 'discord.js';
import { Duration } from 'luxon';
import { videoInfo } from 'ytdl-core';

export class SimpleYTVideoInfo {
  readonly type = 'youtube';
  readonly title: string;
  readonly duration: Duration | 'Live Stream';
  readonly url: string;
  readonly id: string;
  readonly channel: {
    name: string;
    url: string;
  };
  readonly thumbnail?: string;

  constructor(data: videoInfo | SimpleYTVideoInfo) {
    if (data instanceof SimpleYTVideoInfo) {
      this.title = data.title;
      this.url = data.url;
      this.id = data.id;
      this.channel = data.channel;
      this.duration = data.duration;
      this.thumbnail = data.thumbnail;
      return;
    }

    const videoDetails = data.videoDetails;
    this.title = videoDetails.title;
    this.url = videoDetails.video_url;
    this.id = videoDetails.videoId;
    this.channel = {
      name: videoDetails.author.name,
      url: videoDetails.author.channel_url
    };
    this.duration = videoDetails.isLiveContent
      ? 'Live Stream'
      : Duration.fromMillis(Number(videoDetails.lengthSeconds) * 1000);
    this.thumbnail = videoDetails.thumbnails.pop()?.url;
  }
}

export class QueuedYTVideoInfo extends SimpleYTVideoInfo {
  readonly requestedBy: string;

  constructor(data: videoInfo | SimpleYTVideoInfo, user: User) {
    super(data);
    this.requestedBy = user.tag;
  }
}

export class CachedYTVideoInfo extends SimpleYTVideoInfo {
  readonly cachedAt: Date;

  constructor(data: videoInfo | SimpleYTVideoInfo, cachedAt: Date) {
    super(data);
    this.cachedAt = cachedAt;
  }
}
