import { container } from '@sapphire/framework';
import play, { SoundCloudTrack, YouTubeVideo } from 'play-dl';
import {
  TrackInfo,
  CachedTrackInfo
} from '../../../interfaces/Music/Queue System/TrackInfo';

export type TrackCacheResult = {
  data: TrackInfo;
  cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };
};

function getSoundCloudTrackIdentifier(url: string): string {
  // The identifier is the part of the URL after the domain name.
  // An example of a SoundCloud track URL is https://soundcloud.com/artist/track.
  // The identifier for the above example would be "artist/track"

  // The URL may contain query parameters, so we need to remove them.
  // For example, https://soundcloud.com/artist/track?foo=bar"
  // The identifier for the above example would still be "artist/track"
  return url.split('soundcloud.com/')[1].split('?')[0];
}

export function storeTrackInCache(track: TrackInfo) {
  if (track.source === 'youtube') {
    container.caches.youtubeTracks.set(
      track.id,
      new CachedTrackInfo(track, new Date())
    );
  } else if (track.source === 'soundcloud') {
    const identifier = getSoundCloudTrackIdentifier(track.url);

    container.caches.soundcloudTracks.set(
      identifier,
      new CachedTrackInfo(track, new Date())
    );
  }
}

export async function getTrackFromCache(
  trackURL: string
): Promise<TrackCacheResult> {
  let track: TrackInfo;
  let cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };

  if (container.caches.youtubeTracks.has(trackURL)) {
    const fetchedTrack = container.caches.youtubeTracks.get(
      trackURL
    ) as CachedTrackInfo;
    cacheData = {
      status: 'hit',
      cachedAt: fetchedTrack.cachedAt
    };
    track = new TrackInfo(fetchedTrack);
  } else if (
    container.caches.soundcloudTracks.has(
      getSoundCloudTrackIdentifier(trackURL)
    )
  ) {
    const fetchedTrack = container.caches.soundcloudTracks.get(
      getSoundCloudTrackIdentifier(trackURL)
    ) as CachedTrackInfo;

    cacheData = {
      status: 'hit',
      cachedAt: fetchedTrack.cachedAt
    };

    track = new TrackInfo(fetchedTrack);
  } else {
    const linkSource = String(await play.validate(trackURL)).slice(0, 3);

    let fetchedTrack: YouTubeVideo | SoundCloudTrack;

    if (linkSource === 'yt_') {
      try {
        fetchedTrack = await (
          await play.video_basic_info(trackURL)
        ).video_details;
      } catch (error) {
        console.error(error);
        throw new Error(
          `Could not fetch track information for YouTube track ID: ${trackURL}`
        );
      }
    } else if (linkSource === 'so_') {
      try {
        fetchedTrack = (await play.soundcloud(trackURL)) as SoundCloudTrack;
      } catch (error) {
        console.error(error);
        throw new Error(
          `Could not fetch track information for SoundCloud track ID: ${trackURL}`
        );
      }
    } else {
      throw new Error(
        'The URL provided is not a valid YouTube or SoundCloud URL'
      );
    }

    track = new TrackInfo(fetchedTrack);
    storeTrackInCache(track);

    cacheData = {
      status: 'miss',
      cachedAt: new Date()
    };
  }

  return {
    data: track,
    cacheData
  };
}
