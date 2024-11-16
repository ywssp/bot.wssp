'use strict';

import { QueuedTrackInfo } from './Queue System/TrackInfo';
import {
  RadioStationNames,
  RadioStations
} from './Radio/AvailableRadioStations';

export type MusicResourceMetadata =
  | {
      type: 'queued_track';
      data: QueuedTrackInfo;
    }
  | {
      type: 'radio';
      data: {
        title: 'LISTEN.moe Radio';
        url: RadioStations[RadioStationNames]['url'] | 'none';
      };
    };
