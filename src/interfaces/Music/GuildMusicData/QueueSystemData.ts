'use strict';

import {
  QueuedAdaptedTrackInfo,
  QueuedTrackInfo
} from '../Queue System/TrackInfo';

export class QueueSystemData {
  trackQueue: (QueuedTrackInfo | QueuedAdaptedTrackInfo)[];
  trackHistory: (QueuedTrackInfo | QueuedAdaptedTrackInfo)[];
  playing: boolean;
  /**
   * Whether the current track was skipped
   */
  skipped: boolean;
  shuffle: boolean;
  /**
   * How the queue should loop
   * 'off' - The queue will not loop
   * 'track' - The current track will loop
   * 'queue' - The entire queue will loop
   * @default 'off'
   */
  loop:
    | { type: 'off'; emoji: '➡️' }
    | { type: 'track'; emoji: '🔂' }
    | { type: 'queue'; emoji: '🔁' };

  constructor() {
    this.trackQueue = [];
    this.trackHistory = [];
    this.playing = false;
    this.skipped = false;
    this.shuffle = false;
    this.loop = {
      type: 'off',
      emoji: '➡️'
    };
  }

  /**
   * Returns the track in the list at the current index
   */
  currentTrack(): (typeof this.trackQueue)[number] {
    return this.trackQueue[0];
  }

  /**
   * Updates the current track with the given track
   * @param track The track to update the current track with
   */
  updateCurrentTrack(track: (typeof this.trackQueue)[number]) {
    this.trackQueue[0] = track;
  }

  /**
   * Returns the array of tracks after the current track
   */
  getQueue(): typeof this.trackQueue {
    return this.trackQueue;
  }

  /**
   * Returns the array of tracks before the current track
   */
  getHistory(): typeof this.trackHistory {
    return this.trackHistory;
  }

  setLoopType(type: typeof this.loop.type) {
    this.loop = {
      type,
      emoji: ['➡️', '🔂', '🔁'][['off', 'track', 'queue'].indexOf(type)]
    } as typeof this.loop;
  }

  /**
   * Marks the current track as skipped
   * This will cause the track to be skipped when the audio player emits the Idle event, even if the loop type is 'track'
   * This should be called when the track is skipped manually
   */
  markSkipped() {
    this.skipped = true;
  }

  addTrackToQueue(...track: typeof this.trackQueue) {
    this.trackQueue.push(...track);
  }
}
