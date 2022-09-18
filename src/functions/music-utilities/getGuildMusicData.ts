import { container } from '@sapphire/framework';
import { SimpleVideoInfo } from '../../interfaces/SimpleVideoInfo';

export class GuildMusicData {
  videoList: SimpleVideoInfo[];
  videoListIndex: number;
  volume: number;
  loop:
    | { type: 'off'; emoji: '➡️' }
    | { type: 'track'; emoji: '🔂' }
    | { type: 'queue'; emoji: '🔁' };
  textUpdateChannelId: string;
  musicAnnounceStyle: 'full' | 'minimal' | 'none';

  constructor(textUpdateChannelId: string) {
    this.videoList = [];
    this.videoListIndex = 0;
    this.volume = 0.4;
    this.loop = {
      type: 'off',
      emoji: '➡️'
    };
    this.textUpdateChannelId = textUpdateChannelId;
    this.musicAnnounceStyle = 'full';
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
}

export function getGuildMusicData({
  guildId,
  textChannelId,
  create
}: {
  guildId: string;
  textChannelId: string;
  create: true;
}): GuildMusicData;
export function getGuildMusicData({
  guildId,
  create
}: {
  guildId: string;
  create: false;
}): GuildMusicData | undefined;
export function getGuildMusicData({
  guildId,
  textChannelId,
  create
}: {
  guildId: string;
  textChannelId?: string;
  create: boolean;
}) {
  if (create) {
    if (!container.guildMusicDataMap.has(guildId)) {
      container.guildMusicDataMap.set(
        guildId as string,
        new GuildMusicData(textChannelId as string)
      );
    }

    return container.guildMusicDataMap.get(guildId) as GuildMusicData;
  }

  return container.guildMusicDataMap.get(guildId);
}
