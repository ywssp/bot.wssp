import { User } from 'discord.js';
import { Duration } from 'luxon';
import {
  extractID,
  YouTubeVideo,
  SoundCloudTrack,
  SpotifyTrack
} from 'play-dl';
import { SongDetailed as YTMusicSong } from 'ytmusic-api';

export class TrackInfo {
  readonly type = 'queue_track';
  readonly source: 'youtube' | 'soundcloud' | 'youtube_music' | 'spotify';
  readonly title: string;
  readonly duration: Duration | 'Live Stream';
  readonly url: string;
  readonly id: string;
  readonly uploader: {
    name: string;
    url: string | undefined;
  };
  readonly thumbnail?: string;

  constructor(
    data:
      | TrackInfo
      | YouTubeVideo
      | SoundCloudTrack
      | YTMusicSong
      | SpotifyTrack
  ) {
    if (data instanceof TrackInfo) {
      this.source = data.source;
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
      this.source = 'soundcloud';
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
    else if (data instanceof YouTubeVideo) {
      this.source = 'youtube';
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

    // YT Music handling
    // Only YTMusicSong has "type" equal to "SONG"
    else if (data.type === 'SONG') {
      this.source = 'youtube_music';
      this.title = data.name;
      this.url = `https://music.youtube.com/watch?v=${data.videoId}`;
      this.id = data.videoId;
      this.uploader = {
        name: data.artist.name,
        url: data.artist.artistId
          ? `https://music.youtube.com/channel/${data.artist.artistId}`
          : undefined
      };

      if (data.duration === null) {
        this.duration = Duration.fromMillis(0);
      } else {
        this.duration = Duration.fromMillis(data.duration * 1000);
      }

      this.thumbnail = data.thumbnails[data.thumbnails.length - 1]?.url;
    }

    // Spotify Track handling
    else if (data instanceof SpotifyTrack) {
      this.source = 'spotify';
      this.title = data.name;
      this.url = data.url;
      this.id = data.id.toString();
      this.uploader = {
        name: data.artists[0].name,
        url: data.artists[0].url
      };
      this.duration = Duration.fromMillis(data.durationInMs);
      this.thumbnail = data.thumbnail?.url;
      return;
    }

    // If the data is not a valid type
    else {
      throw new Error('Invalid data type provided to TrackInfo constructor.');
    }
  }
}

export class QueuedTrackInfo extends TrackInfo {
  readonly addedBy: string;

  constructor(data: TrackInfo | YouTubeVideo | SoundCloudTrack, user: User) {
    super(data);
    this.addedBy = user.tag;
  }
}

export class CachedTrackInfo extends TrackInfo {
  readonly cachedAt: Date;

  constructor(
    data: TrackInfo | YouTubeVideo | SoundCloudTrack,
    cachedAt: Date
  ) {
    super(data);
    this.cachedAt = cachedAt;
  }
}

export class AdaptedTrackInfo extends TrackInfo {
  readonly matchedTrack: TrackInfo;
  readonly isAdapted = true;
  readonly source: 'spotify';

  constructor(
    data:
      | AdaptedTrackInfo
      | {
          data: TrackInfo;
          matchedTrack: TrackInfo;
        }
  ) {
    let trackData: TrackInfo;
    let matchedTrack: TrackInfo;

    if (data instanceof AdaptedTrackInfo) {
      trackData = data;
      matchedTrack = data.matchedTrack;
    } else {
      trackData = data.data;
      matchedTrack = data.matchedTrack;
    }

    super(trackData);
    this.source = 'spotify';
    this.matchedTrack = matchedTrack;
  }
}

export class QueuedAdaptedTrackInfo extends AdaptedTrackInfo {
  readonly addedBy: string;

  constructor(track: AdaptedTrackInfo, user: User) {
    super(track);
    this.addedBy = user.tag;
  }
}

export class CachedAdaptedTrackInfo extends AdaptedTrackInfo {
  readonly cachedAt: Date;

  constructor(track: AdaptedTrackInfo, cachedAt: Date) {
    super(track);
    this.cachedAt = cachedAt;
  }
}
