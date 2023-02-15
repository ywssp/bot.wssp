import { RadioData } from './RadioData';
import { QueueSystemData } from './QueueSystemData';

export class GuildMusicData {
  textUpdateChannelId: string;
  musicAnnounceStyle: 'full' | 'minimal' | 'none';
  queueSystemData: QueueSystemData;
  radioData: RadioData;

  constructor(textUpdateChannelId: string) {
    this.textUpdateChannelId = textUpdateChannelId;
    this.musicAnnounceStyle = 'full';
    this.queueSystemData = new QueueSystemData();
    this.radioData = new RadioData();
  }
}
