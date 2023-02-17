import { QueuedTrackInfo } from '../TrackInfo';

export class QueueSystemData {
  trackList: QueuedTrackInfo[];
  trackListIndex: number;
  skipped: boolean;
  shuffle: boolean;
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

  isPlaying() {
    return this.trackListIndex < this.trackList.length;
  }

  currentTrack() {
    return this.trackList[this.trackListIndex];
  }

  getQueue() {
    return this.trackList.slice(this.trackListIndex + 1);
  }

  getHistory() {
    return this.trackList.slice(0, this.trackListIndex);
  }

  setLoopType(type: 'off' | 'track' | 'queue') {
    const data = {
      type,
      emoji: ['➡️', '🔂', '🔁'][['off', 'track', 'queue'].indexOf(type)]
    } as typeof this.loop;

    this.loop = data;
  }

  modifyIndex(amount: number) {
    this.trackListIndex += amount;

    if (this.loop.type !== 'track') {
      this.trackListIndex--;
    }
  }
}
