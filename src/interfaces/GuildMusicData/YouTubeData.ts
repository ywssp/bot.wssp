import { SimpleYTVideoInfo } from '../SimpleYTVideoInfo';

export class YouTubeData {
  videoList: SimpleYTVideoInfo[];
  videoListIndex: number;
  loop:
    | { type: 'off'; emoji: '➡️' }
    | { type: 'track'; emoji: '🔂' }
    | { type: 'queue'; emoji: '🔁' };

  constructor() {
    this.videoList = [];
    this.videoListIndex = 0;
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

  modifyIndex(amount: number) {
    this.videoListIndex += amount;

    if (this.loop.type !== 'track') {
      this.videoListIndex--;
    }
  }
}
