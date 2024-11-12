'use strict';

import { container } from '@sapphire/framework';
import * as playdl from 'play-dl';
import {
  TrackInfo,
  CachedTrackInfo
} from '../../../../interfaces/Music/Queue System/TrackInfo';
import { SoundCloudTerms } from '../../../../settings/MusicSourceTerms';
import { TrackCacheResult } from '../../../../interfaces/Music/Queue System/TrackCacheResult';

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

  const urlPaths = urlData.pathname.split('/').filter((path) => path !== '');
  const artist = urlPaths[0];
  const track = urlPaths[1];

  if (!artist || !track) {
    return null;
  }

  return `${artist}/${track}`;
}

export function storeSoundCloudTrackInCache(track: TrackInfo) {
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

async function fetchSoundCloudTrackFromCache(
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
    let fetchedTrack: playdl.SoundCloudTrack;

    try {
      fetchedTrack = (await playdl.soundcloud(
        trackURL
      )) as playdl.SoundCloudTrack;
    } catch {
      throw new Error(
        `Could not fetch information for ${SoundCloudTerms.fullTrackTerm} ID: ${trackURL}`
      );
    }

    track = new TrackInfo(fetchedTrack);
    storeSoundCloudTrackInCache(track);

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

export async function searchSoundCloud(
  linkOrSearch: string,
  options?: {
    limit?: number;
    forceSearch?: boolean;
  }
): Promise<TrackCacheResult | TrackInfo[]> {
  if (
    (await playdl.so_validate(linkOrSearch)) === 'track' &&
    !options?.forceSearch
  ) {
    const url = linkOrSearch;

    let video: TrackCacheResult;

    try {
      video = await fetchSoundCloudTrackFromCache(url);
    } catch {
      throw new Error(
        `Could not fetch information for ${SoundCloudTerms.fullTrackTerm} ID: ${url}`
      );
    }

    return video;
  }

  const limit = options?.limit ?? 1;

  let searchResults: playdl.SoundCloudTrack[];

  try {
    searchResults = await playdl.search(linkOrSearch, {
      limit,
      source: {
        soundcloud: 'tracks'
      }
    });
  } catch {
    throw new Error(
      `An error occurred while searching for ${SoundCloudTerms.trackTerm}s.`
    );
  }

  if (searchResults.length === 0) {
    throw new Error(`No ${SoundCloudTerms.trackTerm}s found.`);
  }

  return searchResults.map((item) => new TrackInfo(item));
}
