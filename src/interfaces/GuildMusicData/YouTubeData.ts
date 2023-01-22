import { QueuedYTVideoInfo } from '../YTVideoInfo';

export class YouTubeData {
  videoList: QueuedYTVideoInfo[];
  videoListIndex: number;
  skipped: boolean;
  shuffle: boolean;
  loop:
    | { type: 'off'; emoji: '➡️' }
    | { type: 'track'; emoji: '🔂' }
    | { type: 'queue'; emoji: '🔁' };

  constructor() {
    this.videoList = [];
    this.videoListIndex = 0;
    this.skipped = false;
    this.shuffle = false;
    this.loop = {
      type: 'off',
      emoji: '➡️'
    };
  }

  isPlaying() {
    return this.videoListIndex < this.videoList.length;
  }

  currentVideo() {
    return this.videoList[this.videoListIndex];
  }

  getQueue() {
    return this.videoList.slice(this.videoListIndex + 1);
  }

  getHistory() {
    return this.videoList.slice(0, this.videoListIndex);
  }

  setLoopType(type: 'off' | 'track' | 'queue') {
    const data = {
      type,
      emoji: ['➡️', '🔂', '🔁'][['off', 'track', 'queue'].indexOf(type)]
    } as typeof this.loop;

    this.loop = data;
  }

  modifyIndex(amount: number) {
    this.videoListIndex += amount;

    if (this.loop.type !== 'track') {
      this.videoListIndex--;
    }
  }
}
