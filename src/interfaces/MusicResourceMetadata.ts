import { RadioStations, RadioStationNames } from './AvailableRadioStations';
import { QueuedYTVideoInfo } from './YTVideoInfo';

export type MusicResourceMetadata =
  | {
      type: 'youtube';
      data: QueuedYTVideoInfo;
    }
  | {
      type: 'radio';
      data: {
        title: 'LISTEN.moe Radio';
        url: RadioStations[RadioStationNames]['url'] | 'none';
      };
    };
