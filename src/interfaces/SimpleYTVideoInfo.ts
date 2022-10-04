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
  readonly requester: string;

  constructor({ videoDetails: data }: videoInfo, requester: User) {
    this.title = data.title;
    this.url = data.video_url;
    this.id = data.videoId;
    this.channel = {
      name: data.author.name,
      url: data.author.channel_url
    };
    this.duration = data.isLiveContent
      ? 'Live Stream'
      : Duration.fromMillis(Number(data.lengthSeconds) * 1000);
    this.thumbnail = data.thumbnails.pop()?.url;
    this.requester = requester.tag;
  }
}
