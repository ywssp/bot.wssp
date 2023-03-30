import { QueuedTrackInfo } from './Queue System/TrackInfo';

export class QueueSystemData {
  trackList: QueuedTrackInfo[];
  trackListIndex: number;
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
    this.trackList = [];
    this.trackListIndex = 0;
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
  currentTrack(): QueuedTrackInfo {
    return this.trackList[this.trackListIndex];
  }

  /**
   * Returns the array of tracks after the current track
   */
  getQueue(): QueuedTrackInfo[] {
    return this.trackList.slice(this.trackListIndex + 1);
  }

  /**
   * Returns the array of tracks before the current track
   */
  getHistory(): QueuedTrackInfo[] {
    return this.trackList.slice(0, this.trackListIndex);
  }

  setLoopType(type: typeof this.loop.type) {
    this.loop = {
      type,
      emoji: ['➡️', '🔂', '🔁'][['off', 'track', 'queue'].indexOf(type)]
    } as typeof this.loop;
  }

  /**
   * Modifies the track list index by the given amount
   * The index will be modified by 1 less than the amount if the loop type is not 'track'
   * @param amount The amount to modify the track list index by
   */
  modifyIndex(amount: number) {
    this.trackListIndex += amount;

    if (this.loop.type !== 'track') {
      this.trackListIndex--;
    }
  }

  /**
   * Marks the current track as skipped
   * This will cause the track to be skipped when the audio player emits the Idle event, even if the loop type is 'track'
   * This should be called when the track is skipped manually
   */
  markSkipped() {
    this.skipped = true;
  }
}
