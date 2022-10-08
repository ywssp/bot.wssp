import { SimpleYTVideoInfo } from '../SimpleYTVideoInfo';

export class YouTubeData {
  videoList: SimpleYTVideoInfo[];
  videoListIndex: number;
  skipped: boolean;
  loop:
    | { type: 'off'; emoji: '➡️' }
    | { type: 'track'; emoji: '🔂' }
    | { type: 'queue'; emoji: '🔁' };

  constructor() {
    this.videoList = [];
    this.videoListIndex = 0;
    this.skipped = false;
    this.loop = {
      type: 'off',
      emoji: '➡️'
    };
  }

  isPlaying() {
    return this.videoList[this.videoListIndex] !== undefined;
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
