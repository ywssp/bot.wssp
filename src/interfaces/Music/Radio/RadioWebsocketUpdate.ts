'use strict';

import { DateTime } from 'luxon';
import { RadioSongInfo } from './RadioSongInfo';

export type RadioWebsocketUpdateData = {
  song: RadioSongInfo;
  startTime: string;
  localStartTime: DateTime | undefined;
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

export type RadioWebsocketUpdate =
  | {
      op: 1;
      d: RadioWebsocketUpdateData;
      t: 'TRACK_UPDATE' | 'TRACK_UPDATE_REQUEST';
    }
  | {
      op: 0;
      d: {
        message: string;
        heartbeat: number;
      };
    }
  | {
      op: 10;
    };
