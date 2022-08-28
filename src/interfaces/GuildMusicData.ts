import type { SimpleVideoInfo } from './SimpleVideoInfo';

export interface GuildMusicData {
  queue: SimpleVideoInfo[];
  volume: number;
  loop:
    | { type: 'off'; emoji: '➡️' }
    | { type: 'track'; emoji: '🔂' }
    | { type: 'queue'; emoji: '🔁' };
}
