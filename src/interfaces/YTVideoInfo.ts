import { User } from 'discord.js';
import { Duration } from 'luxon';
import { extractID, YouTubeVideo, SoundCloudTrack } from 'play-dl';

export class SimpleTrack {
  readonly type = 'queue_track';
  readonly title: string;
  readonly duration: Duration | 'Live Stream';
  readonly url: string;
  readonly id: string;
  readonly uploader: {
    name: string;
    url: string | undefined;
  };
  readonly thumbnail?: string;

  constructor(data: SimpleTrack | YouTubeVideo | SoundCloudTrack) {
    if (data instanceof SimpleTrack) {
      this.title = data.title;
      this.url = data.url;
      this.id = data.id;
      this.uploader = data.uploader;
      this.duration = data.duration;
      this.thumbnail = data.thumbnail;
      return;
    }

    // SoundCloud Track handling
    if (data instanceof SoundCloudTrack) {
      this.title = data.name;
      this.url = data.permalink;
      this.id = data.id.toString();
      this.uploader = {
        name: data.user.name,
        url: data.user.url
      };
      this.duration = Duration.fromMillis(data.durationInMs);
      this.thumbnail = data.thumbnail;
      return;
    }

    // YouTube Video handling
    this.title = data.title ?? 'Unknown';
    this.url = data.url;

    this.id = data.id ?? extractID(data.url);

    this.uploader = {
      name: data.channel?.name ?? 'Unknown',
      url: data.channel?.url
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

export class QueuedTrack extends SimpleTrack {
  readonly requestedBy: string;

  constructor(data: SimpleTrack | YouTubeVideo, user: User) {
    super(data);
    this.requestedBy = user.tag;
  }
}

export class CachedTrack extends SimpleTrack {
  readonly cachedAt: Date;

  constructor(data: SimpleTrack | YouTubeVideo, cachedAt: Date) {
    super(data);
    this.cachedAt = cachedAt;
  }
}
