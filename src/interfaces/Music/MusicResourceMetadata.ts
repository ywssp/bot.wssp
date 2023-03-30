import {
  RadioStations,
  RadioStationNames
} from './Radio/AvailableRadioStations';
import { QueuedTrackInfo } from './GuildMusicData/Queue System/TrackInfo';

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
