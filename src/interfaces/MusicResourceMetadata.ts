import { RadioStations, RadioStationNames } from './AvailableRadioStations';
import { QueuedTrack } from './YTVideoInfo';

export type MusicResourceMetadata =
  | {
      type: 'youtube';
      data: QueuedTrack;
    }
  | {
      type: 'radio';
      data: {
        title: 'LISTEN.moe Radio';
        url: RadioStations[RadioStationNames]['url'] | 'none';
      };
    };
