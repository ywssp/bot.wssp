import { RadioSongInfo } from './RadioSongInfo';

export type RadioWebsocketUpdate =
  | {
      op: 1;
      d: {
        song: RadioSongInfo;
        startTime: string;
        lastPlayed: RadioSongInfo[];
        requester: {
          name: string;
        } | null;
        event: {
          name: string;
          image: string;
        } | null;
        listeners: number;
      };
      t:
        | 'TRACK_UPDATE'
        | 'TRACK_UPDATE_REQUEST'
        | 'QUEUE_UPDATE'
        | 'NOTIFICATION';
    }
  | {
      op: 0;
      d: {
        message: string;
        heartbeat: number;
      };
    };
