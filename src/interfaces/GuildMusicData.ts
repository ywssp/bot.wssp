import { SimpleVideoInfo } from './SimpleVideoInfo';

// Create type for GuildMusicData
export interface GuildMusicData {
  videoList: SimpleVideoInfo[];
  videoListIndex: number;
  volume: number;
  loop:
    | { type: 'off'; emoji: '➡️' }
    | { type: 'track'; emoji: '🔂' }
    | { type: 'queue'; emoji: '🔁' };
  textUpdateChannelId: string;
  musicAnnounceStyle: 'full' | 'minimal' | 'none';

  isPlaying(): boolean;
  currentVideo(): SimpleVideoInfo | undefined;
  getQueue(): SimpleVideoInfo[];
  getHistory(): SimpleVideoInfo[];
}
