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

/**
 * Gets the identifier of a SoundCloud track.
 * @param url The URL of the SoundCloud track to fetch
 * @returns The identifier of the SoundCloud track, or null if the URL is not a valid SoundCloud track URL
 */
function getSoundCloudTrackIdentifier(url: string): string | null {
  // The identifier is the part of the URL after the domain name.
  // An example of a SoundCloud track URL is https://soundcloud.com/artist/track.
  // The identifier for the above example would be "artist/track"

  // The URL may contain query parameters, so we need to remove them.
  // For example, https://soundcloud.com/artist/track?foo=bar"
  // The identifier for the above example would still be "artist/track"

  const urlData = new URL(url);

  if (urlData.hostname !== 'soundcloud.com') {
    return null;
  }

  const artist = urlData.pathname.split('/')[0];
  const track = urlData.pathname.split('/')[1];

  if (!artist || !track) {
    return null;
  }

  return `${artist}/${track}`;
}

export function storeTrackInCache(track: TrackInfo) {
  if (track.source === 'youtube') {
    container.caches.youtubeTracks.set(
      track.id,
      new CachedTrackInfo(track, new Date())
    );
  } else if (track.source === 'soundcloud') {
    const identifier = getSoundCloudTrackIdentifier(track.url);

    if (!identifier) {
      throw new Error(
        `Could not fetch SoundCloud track identifier from URL: ${track.url}`
      );
    }

    container.caches.soundcloudTracks.set(
      identifier,
      new CachedTrackInfo(track, new Date())
    );
  }
}

async function fetchYouTubeTrack(trackURL: string): Promise<TrackCacheResult> {
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
  } else {
    let fetchedTrack: YouTubeVideo;

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

async function fetchSoundCloudTrack(
  trackURL: string
): Promise<TrackCacheResult> {
  let track: TrackInfo;
  let cacheData: {
    status: 'hit' | 'miss';
    cachedAt: Date;
  };

  const trackIdentifier = getSoundCloudTrackIdentifier(trackURL);

  if (!trackIdentifier) {
    throw new Error(
      `Could not fetch SoundCloud track identifier from URL: ${trackURL}`
    );
  }

  if (container.caches.soundcloudTracks.has(trackIdentifier)) {
    const fetchedTrack = container.caches.soundcloudTracks.get(
      trackIdentifier
    ) as CachedTrackInfo;

    cacheData = {
      status: 'hit',
      cachedAt: fetchedTrack.cachedAt
    };

    track = new TrackInfo(fetchedTrack);
  } else {
    let fetchedTrack: SoundCloudTrack;

    try {
      fetchedTrack = (await play.soundcloud(trackURL)) as SoundCloudTrack;
    } catch (error) {
      console.error(error);
      throw new Error(
        `Could not fetch track information for SoundCloud track ID: ${trackURL}`
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

export async function getTrackFromCache(
  trackURL: string
): Promise<TrackCacheResult> {
  const urlType = await play.validate(trackURL);
  const isYouTubeURL = String(urlType).slice(0, 3) === 'yt_';
  const isSoundCloudURL = String(urlType).slice(0, 3) === 'so_';

  console.log(`URL type: ${urlType}`);
  // This should never happen, this is just an extra precaution.
  if (isYouTubeURL && isSoundCloudURL) {
    throw new Error(
      `Could not fetch track information for track ID "${trackURL}", because the URL was validated as both a YouTube and SoundCloud URL.`
    );
  }

  let cacheResult: TrackCacheResult;

  if (isYouTubeURL) {
    cacheResult = await fetchYouTubeTrack(trackURL);
  } else if (isSoundCloudURL) {
    cacheResult = await fetchSoundCloudTrack(trackURL);
  } else {
    throw new Error(
      `Could not fetch track information for track ID "${trackURL}", because the URL is not a valid YouTube or SoundCloud URL.`
    );
  }

  return cacheResult;
}
