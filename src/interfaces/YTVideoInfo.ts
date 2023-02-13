import { User } from 'discord.js';
import { Duration } from 'luxon';
import { extractID, YouTubeVideo } from 'play-dl';

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

  constructor(data: YouTubeVideo | SimpleYTVideoInfo) {
    if (data instanceof SimpleYTVideoInfo) {
      this.title = data.title;
      this.url = data.url;
      this.id = data.id;
      this.channel = data.channel;
      this.duration = data.duration;
      this.thumbnail = data.thumbnail;
      return;
    }

    this.title = data.title ?? 'Unknown';
    this.url = data.url;

    this.id = data.id ?? extractID(data.url);

    this.channel = {
      name: data.channel?.name ?? 'Unknown',
      url: data.channel?.url ?? ''
    };

    this.duration = data.live
      ? 'Live Stream'
      : Duration.fromMillis(Number(data.durationInSec) * 1000);

    if (data.thumbnails.length > 0) {
      const highestResThumbnail = data.thumbnails.reduce((prev, curr) => {
        if (prev.width * prev.height > curr.width * curr.height) {
          return curr;
        }
        return prev;
      });

      this.thumbnail = highestResThumbnail.url;
    }
  }
}

export class QueuedYTVideoInfo extends SimpleYTVideoInfo {
  readonly requestedBy: string;

  constructor(data: YouTubeVideo | SimpleYTVideoInfo, user: User) {
    super(data);
    this.requestedBy = user.tag;
  }
}

export class CachedYTVideoInfo extends SimpleYTVideoInfo {
  readonly cachedAt: Date;

  constructor(data: YouTubeVideo | SimpleYTVideoInfo, cachedAt: Date) {
    super(data);
    this.cachedAt = cachedAt;
  }
}
